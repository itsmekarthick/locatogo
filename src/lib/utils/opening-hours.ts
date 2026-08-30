/**
 * isOpenNow — determines if a place is currently open based on its hours
 * @param hours Array of listing_hours rows from Supabase
 */
export interface ListingHour {
  day_of_week: number; // 0=Sunday, 1=Monday ... 6=Saturday
  open_time: string;   // "HH:MM" e.g. "09:00"
  close_time: string;  // "HH:MM" e.g. "21:00"
  is_closed: boolean;  // true = closed all day
}

export type OpenStatus = "open" | "closed" | "unknown";

export function isOpenNow(hours: ListingHour[]): OpenStatus {
  if (!hours || hours.length === 0) return "unknown";

  const now = new Date();
  const todayDow = now.getDay(); // 0=Sunday ... 6=Saturday
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const todayHours = hours.filter((h) => h.day_of_week === todayDow);
  if (todayHours.length === 0) return "unknown";

  for (const slot of todayHours) {
    if (slot.is_closed) return "closed";

    const [openH, openM] = slot.open_time.split(":").map(Number);
    const [closeH, closeM] = slot.close_time.split(":").map(Number);
    const openMins = openH * 60 + openM;
    let closeMins = closeH * 60 + closeM;

    // Handle midnight wrap (e.g. 22:00 - 02:00)
    if (closeMins <= openMins) closeMins += 24 * 60;

    if (currentMinutes >= openMins && currentMinutes < closeMins) return "open";
  }

  return "closed";
}

export function formatOpenStatus(status: OpenStatus): {
  label: string;
  color: string;
  dot: string;
} {
  switch (status) {
    case "open":
      return { label: "Open Now", color: "text-emerald-700", dot: "bg-emerald-500" };
    case "closed":
      return { label: "Closed", color: "text-red-600", dot: "bg-red-500" };
    default:
      return { label: "", color: "", dot: "" };
  }
}
