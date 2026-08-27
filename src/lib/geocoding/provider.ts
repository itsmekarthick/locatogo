export type AddressInput = {
  addressLine1: string;
  city?: string;
  administrativeArea?: string;
  countryCode?: string;
  postalCode?: string;
};

export type GeocodedLocation = { latitude: number; longitude: number; timezone?: string };

export interface GeocodingService {
  geocode(address: AddressInput): Promise<GeocodedLocation | null>;
  reverseGeocode(latitude: number, longitude: number): Promise<AddressInput | null>;
  autocomplete(query: string): Promise<AddressInput[]>;
}

export class UnconfiguredGeocodingService implements GeocodingService {
  async geocode(): Promise<GeocodedLocation | null> { return null; }
  async reverseGeocode(): Promise<AddressInput | null> { return null; }
  async autocomplete(): Promise<AddressInput[]> { return []; }
}
