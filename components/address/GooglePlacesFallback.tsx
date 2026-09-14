import { useEffect, useRef, useState } from 'react';
import { importLibrary, setOptions } from '@googlemaps/js-api-loader';
import { payloadFromGoogleComponents, type PlacePayload } from '../../utils/placePayload';

type GmpSelectEvent = Event & {
  placePrediction?: {
    toPlace: () => {
      fetchFields: (opts: { fields: string[] }) => Promise<void>;
      addressComponents?: Array<{
        types?: string[];
        longText?: string;
        long_name?: string;
        shortText?: string;
        short_name?: string;
      }>;
      formattedAddress?: string;
      location?: { lat: () => number; lng: () => number };
    };
  };
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect?: (place: PlacePayload) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
};

function getGoogleMapsApiKey(): string {
  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
  return (env?.VITE_GOOGLE_MAPS_API_KEY || '').trim();
}

export function GooglePlacesFallback({
  value,
  onChange,
  onPlaceSelect,
  placeholder,
  className,
  disabled,
  id,
}: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const onChangeRef = useRef(onChange);
  const onPlaceSelectRef = useRef(onPlaceSelect);
  const valueRef = useRef(value);
  const [manual, setManual] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
    onPlaceSelectRef.current = onPlaceSelect;
    valueRef.current = value;
  }, [onChange, onPlaceSelect, value]);

  useEffect(() => {
    if (manual) return;
    const host = hostRef.current;
    const apiKey = getGoogleMapsApiKey();
    if (!host) return;
    if (!apiKey) {
      setManual(true);
      return;
    }

    let cancelled = false;
    let widget: HTMLElement | null = null;

    const start = async () => {
      try {
        setOptions({ key: apiKey, v: 'weekly' });
        const placesLib = (await importLibrary('places')) as {
          PlaceAutocompleteElement?: new (opts: { includedPrimaryTypes: string[] }) => HTMLElement & {
            placeholder?: string;
          };
        };
        if (cancelled || !hostRef.current) return;
        const Ctor = placesLib.PlaceAutocompleteElement;
        if (!Ctor) {
          setManual(true);
          return;
        }

        const placesWidget = new Ctor({
          includedPrimaryTypes: ['street_address', 'premise', 'subpremise'],
        });
        placesWidget.style.width = '100%';
        if (placeholder) placesWidget.placeholder = placeholder;
        widget = placesWidget;

        const handleSelect = async (event: Event) => {
          const prediction = (event as GmpSelectEvent).placePrediction;
          if (!prediction) return;
          const place = prediction.toPlace();
          await place.fetchFields({
            fields: ['addressComponents', 'formattedAddress', 'location'],
          });
          const payload = payloadFromGoogleComponents(place.addressComponents ?? [], {
            formattedAddress: place.formattedAddress,
            fallbackAddress: valueRef.current,
            latitude: place.location?.lat() ?? 0,
            longitude: place.location?.lng() ?? 0,
          });
          onChangeRef.current(payload.address);
          onPlaceSelectRef.current?.(payload);
        };

        widget.addEventListener('gmp-select', handleSelect);
        hostRef.current.appendChild(widget);
        const input = widget.shadowRoot?.querySelector('input');
        if (input) {
          input.autocomplete = 'address-line1';
          if (valueRef.current) input.value = valueRef.current;
          input.addEventListener('input', () => onChangeRef.current(input.value));
        }
      } catch {
        if (!cancelled) setManual(true);
      }
    };

    void start();
    return () => {
      cancelled = true;
      widget?.remove();
    };
  }, [manual, placeholder]);

  if (manual) {
    return (
      <input
        id={id}
        value={value}
        disabled={disabled}
        autoComplete="address-line1"
        placeholder={placeholder}
        className={className}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  return <div ref={hostRef} id={id} className={className} />;
}
