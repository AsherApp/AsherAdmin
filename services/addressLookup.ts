import { api } from '../config/api';
import type { PlacePayload } from '../utils/placePayload';

export type AddressSuggestion = {
  id: string;
  street: string | null;
  area: string | null;
  city: string;
  state: string | null;
  country: string;
  postcode: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export type ResolvedAddressParts = {
  address: string;
  city: string;
  state: string;
  county?: string;
  country: string;
  postcode: string;
  latitude?: string;
  longitude?: string;
};

const UK_POSTCODE = /\b([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})\b/i;

export function extractUkPostcode(value: string): string | null {
  const match = value.trim().match(UK_POSTCODE);
  if (!match) return null;
  return `${match[1]} ${match[2]}`.toUpperCase();
}

export function extractHouseNumber(value: string): string | undefined {
  const match = value.trim().match(/^(\d+[A-Z]?)\b/i);
  return match?.[1];
}

export function isUkCountry(country?: string | null): boolean {
  const value = String(country || '').toLowerCase();
  return value.includes('united kingdom') || value === 'uk' || value === 'gb';
}

function formatSuggestionLine(item: AddressSuggestion): string {
  return [item.street, item.area, item.city, item.postcode].filter(Boolean).join(', ');
}

export function suggestionToAddressParts(
  item: AddressSuggestion,
  typed?: string
): ResolvedAddressParts {
  const street = item.street?.trim() || '';
  const house = extractHouseNumber(typed || '');
  const address =
    street && house && !street.toLowerCase().startsWith(house.toLowerCase())
      ? `${house} ${street}`
      : street || typed?.trim() || formatSuggestionLine(item);

  return {
    address,
    city: item.city || '',
    state: item.state || '',
    county: item.area || '',
    country: item.country || '',
    postcode: item.postcode || extractUkPostcode(typed || '') || '',
    latitude: item.latitude != null ? String(item.latitude) : undefined,
    longitude: item.longitude != null ? String(item.longitude) : undefined,
  };
}

export async function suggestPropertyAddresses(params: {
  country: string;
  q: string;
  city?: string;
}): Promise<AddressSuggestion[]> {
  const search = new URLSearchParams({ country: params.country, q: params.q });
  if (params.city) search.set('city', params.city);
  try {
    const response = await api.get(`/addresses/suggest?${search.toString()}`);
    const data = response?.data ?? response;
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function resolveUkPropertyAddress(params: {
  postcode: string;
  houseNumber?: string;
  streetHint?: string;
  cityHint?: string;
}): Promise<ResolvedAddressParts | null> {
  try {
    const response = await api.post('/addresses/resolve/uk', params);
    const data = response?.data ?? response;
    if (!data) return null;
    return suggestionToAddressParts(data, params.streetHint);
  } catch {
    return null;
  }
}

export async function bankResolvedAddress(place: PlacePayload | ResolvedAddressParts): Promise<void> {
  const latitude = Number(place.latitude);
  const longitude = Number(place.longitude);
  if (!place.city || !place.country || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return;
  }
  if (latitude === 0 && longitude === 0) return;
  try {
    await api.post('/addresses', {
      houseNumber: extractHouseNumber(place.address),
      street: place.address,
      area: 'county' in place ? place.county || null : null,
      city: place.city,
      state: place.state || null,
      country: place.country,
      postcode: place.postcode || null,
      latitude,
      longitude,
    });
  } catch {
    // Banking must never block the form.
  }
}
