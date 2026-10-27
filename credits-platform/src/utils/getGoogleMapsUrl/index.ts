const GOOGLE_MAPS_URL = "https://www.google.com.br/maps";

/** e.g. "Papa Joao XXIII, 28, Ribeirao Pires, SP" -> "https://www.google.com.br/maps?q=Papa+Joao+XXIII%2C+28%2C+Ribeirao+Pires%2C+SP" */
export function getGoogleMapsUrl(address: string): string {
  return `${GOOGLE_MAPS_URL}?${new URLSearchParams({ q: address })}`;
}
