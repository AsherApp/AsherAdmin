import { useEffect, useRef, useState } from 'react';
import { GooglePlacesFallback } from './GooglePlacesFallback';
import type { PlacePayload } from '../../utils/placePayload';
import {
  bankResolvedAddress,
  extractHouseNumber,
  extractUkPostcode,
  formatSuggestionLine,
  isUkCountry,
  resolveUkPropertyAddress,
  resolveUkPropertySuggestion,
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
  placeholder = 'Enter postcode and house number',
  className,
  disabled,
  id,
}: Props) {
  const uk = isUkCountry(country);
  const [items, setItems] = useState<AddressSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [useGoogle, setUseGoogle] = useState(false);
  const [postcode, setPostcode] = useState(() => extractUkPostcode(value) || '');
  const [houseNumber, setHouseNumber] = useState('');
  const [preview, setPreview] = useState<AddressSuggestion | null>(null);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [manualUk, setManualUk] = useState(false);
  const skipSuggest = useRef(false);
  const lastQuery = useRef('');

  useEffect(() => {
    const fromValue = extractUkPostcode(value);
    if (fromValue && !postcode) setPostcode(fromValue);
  }, [value, postcode]);

  useEffect(() => {
    if (value.trim().length < 3) setUseGoogle(false);
  }, [value]);

  useEffect(() => {
    if (uk && !manualUk) return;
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
  }, [value, country, city, useGoogle, disabled, uk, manualUk]);

  const emit = (parts: ResolvedAddressParts) => {
    skipSuggest.current = true;
    onChange(parts.address);
    onResolved?.(parts);
    setOpen(false);
    setItems([]);
    setPreview(null);
    setResolveError(null);
  };

  const findUkAddress = async () => {
    const pc = extractUkPostcode(postcode) || postcode.trim().toUpperCase();
    if (!pc || pc.replace(/\s+/g, '').length < 5) {
      setResolveError('Enter a full UK postcode first.');
      return;
    }
    setLoading(true);
    setResolveError(null);
    setPreview(null);
    try {
      const resolved = await resolveUkPropertySuggestion({
        postcode: pc,
        houseNumber: houseNumber.trim() || undefined,
        cityHint: city,
      });
      if (!resolved) {
        setResolveError(
          'We could not find that postcode. Try again or enter the address manually.'
        );
        return;
      }
      setPostcode(resolved.postcode || pc);
      setPreview({
        ...resolved,
        houseNumber: houseNumber.trim() || resolved.houseNumber || null,
      });
    } finally {
      setLoading(false);
    }
  };

  const acceptPreview = () => {
    if (!preview) return;
    emit(
      suggestionToAddressParts(
        {
          ...preview,
          houseNumber: houseNumber.trim() || preview.houseNumber || null,
        },
        houseNumber.trim()
      )
    );
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
        {uk ? (
          <button
            type="button"
            className="text-xs text-blue-600 underline"
            onClick={() => {
              setUseGoogle(false);
              setManualUk(false);
            }}
          >
            Back to postcode lookup
          </button>
        ) : null}
      </div>
    );
  }

  if (uk && !manualUk) {
    return (
      <div className="space-y-2">
        <div className="grid gap-2 md:grid-cols-2">
          <label className="text-xs font-bold text-gray-600">
            POSTCODE
            <input
              id={id}
              value={postcode}
              disabled={disabled}
              placeholder="e.g. SW1A 1AA"
              className={className || 'glass-input mt-2 w-full p-3 rounded-xl text-sm'}
              onChange={(event) => {
                setPostcode(event.target.value.toUpperCase());
                setPreview(null);
                setResolveError(null);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  void findUkAddress();
                }
              }}
            />
          </label>
          <label className="text-xs font-bold text-gray-600">
            HOUSE / FLAT NUMBER
            <input
              value={houseNumber}
              disabled={disabled}
              placeholder="e.g. 12 or 12A"
              className={className || 'glass-input mt-2 w-full p-3 rounded-xl text-sm'}
              onChange={(event) => {
                setHouseNumber(event.target.value);
                setPreview(null);
                setResolveError(null);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  void findUkAddress();
                }
              }}
            />
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={disabled || loading}
            className="rounded-xl bg-gray-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
            onClick={() => void findUkAddress()}
          >
            {loading ? 'Looking up…' : 'Find address'}
          </button>
          <button
            type="button"
            className="text-xs text-gray-500 underline"
            onClick={() => {
              setManualUk(true);
              setUseGoogle(false);
            }}
          >
            Enter address manually
          </button>
        </div>
        {resolveError ? (
          <p className="normal-case font-normal text-sm text-red-600">{resolveError}</p>
        ) : null}
        {preview ? (
          <div className="rounded-xl border border-gray-200 bg-white p-3">
            <p className="text-sm font-semibold text-gray-900">Is this the right address?</p>
            <p className="mt-1 text-sm text-gray-700">
              {formatSuggestionLine({
                ...preview,
                houseNumber: houseNumber.trim() || preview.houseNumber,
              })}
            </p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white"
                onClick={acceptPreview}
              >
                Use this address
              </button>
              <button
                type="button"
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-600"
                onClick={() => setPreview(null)}
              >
                Try again
              </button>
            </div>
          </div>
        ) : null}
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
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 150);
          if (uk) {
            void (async () => {
              const pc = extractUkPostcode(value);
              if (pc) {
                const resolved = await resolveUkPropertyAddress({
                  postcode: pc,
                  houseNumber: extractHouseNumber(value),
                  streetHint: value,
                  cityHint: city,
                });
                if (resolved) {
                  emit(resolved);
                  return;
                }
              }
              if (value.trim().length >= 5 && items.length === 0) setUseGoogle(true);
            })();
          } else if (value.trim().length >= 5 && items.length === 0) {
            setUseGoogle(true);
          }
        }}
      />
      {uk ? (
        <button
          type="button"
          className="mt-1 text-xs text-blue-600 underline"
          onClick={() => {
            setManualUk(false);
            setUseGoogle(false);
          }}
        >
          Use postcode lookup instead
        </button>
      ) : null}
      {loading ? (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
          …
        </span>
      ) : null}
      {open && items.length > 0 ? (
        <ul className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-gray-200 bg-white py-1 text-sm shadow-lg">
          {items.map((item) => {
            const line = formatSuggestionLine(item);
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
