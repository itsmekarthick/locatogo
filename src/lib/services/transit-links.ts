// Transit & Communication Deep-Link Helpers for Bangalore Atlas

/**
 * Generates an Uber Universal Deep Link that prefills the destination coordinates and formatted address.
 * Formatted to trigger the native Uber app on Mobile (iOS/Android) with destination preselected.
 */
export function generateUberRideLink(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
  title: string,
  locality?: string | null
): string {
  const cleanTitle = title.replace(/[^\w\s-]/g, "").trim();
  const fullAddress = `${cleanTitle}${locality ? ', ' + locality : ''}, Bangalore, Karnataka, India`;

  if (!latitude || !longitude) {
    return `https://m.uber.com/ul/?action=setPickup&pickup[latitude]=my_location&pickup[longitude]=my_location&dropoff[nickname]=${encodeURIComponent(cleanTitle)}&dropoff[formatted_address]=${encodeURIComponent(fullAddress)}`;
  }

  // Exact Uber Universal Link schema per Uber Developer Specs
  return `https://m.uber.com/ul/?action=setPickup&pickup[latitude]=my_location&pickup[longitude]=my_location&dropoff[latitude]=${latitude}&dropoff[longitude]=${longitude}&dropoff[nickname]=${encodeURIComponent(cleanTitle)}&dropoff[formatted_address]=${encodeURIComponent(fullAddress)}`;
}

/**
 * Generates an Ola Cabs booking link that seamlessly opens in the Ola App or mobile web with destination prefilled.
 */
export function generateOlaRideLink(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
  title: string,
  locality?: string | null
): string {
  const dropName = `${title}${locality ? ' ' + locality : ''}`;
  if (!latitude || !longitude) {
    return `https://book.olacabs.com/?drop_name=${encodeURIComponent(dropName + ' Bangalore')}&landing_page=bk`;
  }
  return `https://book.olacabs.com/?drop_lat=${latitude}&drop_lng=${longitude}&drop_name=${encodeURIComponent(dropName)}&landing_page=bk`;
}

/**
 * Generates a direct WhatsApp click-to-chat link with prefilled contextual message.
 */
export function generateWhatsAppInquiryLink(
  phone: string | null | undefined,
  title: string,
  categoryName?: string | null
): string | null {
  if (!phone) return null;
  
  // Clean phone number (strip non-numeric characters)
  let cleanPhone = phone.replace(/[^0-9]/g, "");
  
  if (cleanPhone.length === 10) {
    cleanPhone = "91" + cleanPhone; // Prefix India country code
  } else if (cleanPhone.startsWith("0") && cleanPhone.length === 11) {
    cleanPhone = "91" + cleanPhone.slice(1);
  }

  const message = `Hello, I found ${title} (${categoryName || 'Place'}) on Locatogo Bangalore Atlas. I would like to inquire about your timings and services.`;
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
