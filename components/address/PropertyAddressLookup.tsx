import { useEffect, useRef, useState } from 'react';
import { GooglePlacesFallback } from './GooglePlacesFallback';
import type { PlacePayload } from '../../utils/placePayload';
import {
  bankResolvedAddress,
  extractHouseNumber,
  extractUkPostcode,
  isUkCountry,
  resolveUkPropertyAddress,
  suggestPropertyAddresses,
  suggestionToAddressParts,
  type AddressSuggestion,
  type ResolvedAddressParts,
} from '../../services/addressLookup';

type Props = {
  value: string;
  onChange: (value: string) => void;
  onResolved?: (parts: ResolvedAddressParts) => void;
  country?: string | null;
  city?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
};

export function PropertyAddressLookup({
  value,
  onChange,
  onResolved,
  country,
  city,
  placeholder = 'Start typing street or postcode...',
  className,
  disabled,
  id,
}: Props) {
  const [items, setItems] = useState<AddressSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [useGoogle, setUseGoogle] = useState(false);
  const skipSuggest = useRef(false);
  const lastQuery = useRef('');

  useEffect(() => {
    if (value.trim().length < 3) setUseGoogle(false);
  }, [value]);

  useEffect(() => {
    if (skipSuggest.current) {
      skipSuggest.current = false;
      return;
    }
    if (useGoogle || disabled) return;
    const q = value.trim();
    if (q.length < 3) {
      setItems([]);
      setOpen(false);
      return;
    }
    if (!country) {
      if (q.length >= 5) setUseGoogle(true);
      return;
    }

    const handle = window.setTimeout(async () => {
      lastQuery.current = q;
      setLoading(true);
      const suggestions = await suggestPropertyAddresses({ country, q, city });
      if (lastQuery.current !== q) return;
      setItems(suggestions);
      setOpen(suggestions.length > 0);
      setLoading(false);
      if (suggestions.length === 0 && q.length >= 5) setUseGoogle(true);
    }, 280);

    return () => window.clearTimeout(handle);
  }, [value, country, city, useGoogle, disabled]);

  const emit = (parts: ResolvedAddressParts) => {
    skipSuggest.current = true;
    onChange(parts.address);
    onResolved?.(parts);
    setOpen(false);
    setItems([]);
  };

  const handleBlur = () => {
    window.setTimeout(() => setOpen(false), 150);
    void (async () => {
      if (isUkCountry(country)) {
        const postcode = extractUkPostcode(value);
        if (postcode) {
          const resolved = await resolveUkPropertyAddress({
            postcode,
            houseNumber: extractHouseNumber(value),
            streetHint: value,
            cityHint: city,
          });
          if (resolved) {
            emit(resolved);
            return;
          }
        }
      }
      if (value.trim().length >= 5 && items.length === 0) setUseGoogle(true);
    })();
  };

  const handleGoogleSelect = (place: PlacePayload) => {
    onChange(place.address);
    onResolved?.({
      address: place.address,
      city: place.city,
      state: place.state,
      county: place.county,
      country: place.country,
      postcode: place.postcode,
      latitude: place.latitude,
      longitude: place.longitude,
    });
    void bankResolvedAddress(place);
  };

  if (useGoogle) {
    return (
      <div className="space-y-1">
        <GooglePlacesFallback
          id={id}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          className={className}
          onChange={onChange}
          onPlaceSelect={handleGoogleSelect}
        />
        <p className="normal-case font-normal text-xs text-gray-500">
          Not in our street book yet — using Google for this address.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        id={id}
        autoComplete="off"
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        className={className}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => items.length && setOpen(true)}
        onBlur={handleBlur}
      />
      {loading ? (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
          …
        </span>
      ) : null}
      {open && items.length > 0 ? (
        <ul className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-gray-200 bg-white py-1 text-sm shadow-lg">
          {items.map((item) => {
            const line = [item.street, item.area, item.city, item.postcode]
              .filter(Boolean)
              .join(', ');
            return (
              <li key={item.id}>
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left hover:bg-gray-50"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => emit(suggestionToAddressParts(item, value))}
                >
                  {line || item.postcode}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
