export type PlacePayload = {
  address: string;
  city: string;
  state: string;
  county: string;
  postcode: string;
  country: string;
  latitude: string;
  longitude: string;
};

const ISO_MARKETS: Record<string, string> = {
  GB: 'United Kingdom',
  UK: 'United Kingdom',
  NG: 'Nigeria',
  US: 'United States',
  IE: 'Ireland',
};

type AddressComponent = {
  types?: string[];
  longText?: string;
  long_name?: string;
  shortText?: string;
  short_name?: string;
};

function componentName(component: AddressComponent, short = false): string {
  if (short) {
    return component.shortText || component.short_name || component.longText || component.long_name || '';
  }
  return component.longText || component.long_name || component.short_name || '';
}

export function payloadFromGoogleComponents(
  addressComponents: AddressComponent[],
  options: {
    formattedAddress?: string;
    fallbackAddress?: string;
    latitude?: number;
    longitude?: number;
  } = {}
): PlacePayload {
  let streetNumber = '';
  let route = '';
  let city = '';
  let state = '';
  let county = '';
  let postcode = '';
  let country = '';
  let countryShort = '';
  let sublocality = '';

  for (const component of addressComponents) {
    const types = component.types || [];
    const longName = componentName(component);
    const shortName = componentName(component, true);
    if (types.includes('street_number')) streetNumber = longName;
    if (types.includes('route')) route = longName;
    if (types.includes('locality')) city = longName;
    if (types.includes('postal_town') && !city) city = longName;
    if (types.includes('administrative_area_level_1')) state = longName;
    if (types.includes('administrative_area_level_2')) county = longName;
    if (types.includes('administrative_area_level_3') && !county) county = longName;
    if (types.includes('postal_code')) postcode = longName || shortName;
    if (types.includes('postal_code_prefix') && !postcode) postcode = shortName;
    if (types.includes('country')) {
      country = longName;
      countryShort = shortName;
    }
    if (
      types.includes('sublocality') ||
      types.includes('sublocality_level_1') ||
      types.includes('sublocality_level_2')
    ) {
      sublocality = longName || sublocality;
    }
  }

  country = ISO_MARKETS[countryShort.toUpperCase()] || country;
  if (!city && sublocality) city = sublocality;

  const street = [streetNumber, route].filter(Boolean).join(' ').trim();
  return {
    address: street || options.formattedAddress?.trim() || options.fallbackAddress?.trim() || '',
    city,
    state: county && country === 'United Kingdom' ? county : state,
    county,
    postcode,
    country,
    latitude: String(options.latitude ?? 0),
    longitude: String(options.longitude ?? 0),
  };
}
