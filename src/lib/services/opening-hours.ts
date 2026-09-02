export type ListingHour = {
  day_of_week: number; // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  is_closed: boolean;
  is_24_hours: boolean;
  open_time?: string | null;
  close_time?: string | null;
};

export type LiveOpeningStatus = {
  isOpen: boolean;
  isClosingSoon: boolean;
  statusBadge: string;
  statusText: string;
  badgeClass: string;
  dotColorClass: string;
};

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function parseTimeToMinutes(timeStr?: string | null): number | null {
  if (!timeStr) return null;
  const parts = timeStr.split(":");
  if (parts.length < 2) return null;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

function formatMinutesTo12Hour(minutes: number): string {
  const h24 = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const mStr = m > 0 ? `:${m.toString().padStart(2, "0")}` : ":00";
  return `${h12}${mStr} ${period}`;
}

export function computeLiveOpeningStatus(
  hours?: ListingHour[] | null,
  fallbackIsOpenNow?: boolean
): LiveOpeningStatus {
  // If no hours schedule configured in database
  if (!hours || hours.length === 0) {
    if (fallbackIsOpenNow !== undefined) {
      return {
        isOpen: fallbackIsOpenNow,
        isClosingSoon: false,
        statusBadge: fallbackIsOpenNow ? "Open Now" : "Closed",
        statusText: fallbackIsOpenNow ? "Currently open" : "Currently closed",
        badgeClass: fallbackIsOpenNow
          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60"
          : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/60",
        dotColorClass: fallbackIsOpenNow ? "bg-emerald-500" : "bg-rose-500",
      };
    }

    return {
      isOpen: true,
      isClosingSoon: false,
      statusBadge: "Hours Verified",
      statusText: "Operational hours vary",
      badgeClass: "bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800",
      dotColorClass: "bg-slate-400",
    };
  }

  const now = new Date();
  const currentDay = now.getDay();
  const currentMinute = now.getHours() * 60 + now.getMinutes();

  const todaySchedule = hours.find((h) => h.day_of_week === currentDay);

  if (!todaySchedule || todaySchedule.is_closed) {
    // Find next day that is open
    let nextOpenText = "Closed today";
    for (let offset = 1; offset <= 7; offset++) {
      const nextDayIdx = (currentDay + offset) % 7;
      const nextSched = hours.find((h) => h.day_of_week === nextDayIdx);
      if (nextSched && !nextSched.is_closed) {
        const dayLabel = offset === 1 ? "tomorrow" : `on ${DAYS[nextDayIdx]}`;
        const openTimeMins = parseTimeToMinutes(nextSched.open_time);
        const timeLabel = openTimeMins !== null ? ` at ${formatMinutesTo12Hour(openTimeMins)}` : "";
        nextOpenText = `Closed · Opens ${dayLabel}${timeLabel}`;
        break;
      }
    }

    return {
      isOpen: false,
      isClosingSoon: false,
      statusBadge: "Closed",
      statusText: nextOpenText,
      badgeClass: "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/60",
      dotColorClass: "bg-rose-500",
    };
  }

  if (todaySchedule.is_24_hours) {
    return {
      isOpen: true,
      isClosingSoon: false,
      statusBadge: "Open 24 Hours",
      statusText: "Open 24 hours today",
      badgeClass: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60",
      dotColorClass: "bg-emerald-500",
    };
  }

  const openMins = parseTimeToMinutes(todaySchedule.open_time);
  const closeMins = parseTimeToMinutes(todaySchedule.close_time);

  if (openMins === null || closeMins === null) {
    return {
      isOpen: true,
      isClosingSoon: false,
      statusBadge: "Open",
      statusText: "Open today",
      badgeClass: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60",
      dotColorClass: "bg-emerald-500",
    };
  }

  // Case: currently before opening
  if (currentMinute < openMins) {
    return {
      isOpen: false,
      isClosingSoon: false,
      statusBadge: "Closed",
      statusText: `Closed · Opens today at ${formatMinutesTo12Hour(openMins)}`,
      badgeClass: "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/60",
      dotColorClass: "bg-rose-500",
    };
  }

  // Case: currently between open and close
  if (currentMinute >= openMins && currentMinute < closeMins) {
    const minutesRemaining = closeMins - currentMinute;

    if (minutesRemaining <= 60 && minutesRemaining > 0) {
      return {
        isOpen: true,
        isClosingSoon: true,
        statusBadge: "Closing Soon",
        statusText: `Closing soon · Closes in ${minutesRemaining}m (${formatMinutesTo12Hour(closeMins)})`,
        badgeClass: "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60",
        dotColorClass: "bg-amber-500",
      };
    }

    return {
      isOpen: true,
      isClosingSoon: false,
      statusBadge: "Open Now",
      statusText: `Open now · Closes at ${formatMinutesTo12Hour(closeMins)}`,
      badgeClass: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60",
      dotColorClass: "bg-emerald-500",
    };
  }

  // Case: after closing time today
  let nextOpenText = "Closed for the day";
  for (let offset = 1; offset <= 7; offset++) {
    const nextDayIdx = (currentDay + offset) % 7;
    const nextSched = hours.find((h) => h.day_of_week === nextDayIdx);
    if (nextSched && !nextSched.is_closed) {
      const dayLabel = offset === 1 ? "tomorrow" : `on ${DAYS[nextDayIdx]}`;
      const nextOpenMins = parseTimeToMinutes(nextSched.open_time);
      const timeLabel = nextOpenMins !== null ? ` at ${formatMinutesTo12Hour(nextOpenMins)}` : "";
      nextOpenText = `Closed · Opens ${dayLabel}${timeLabel}`;
      break;
    }
  }

  return {
    isOpen: false,
    isClosingSoon: false,
    statusBadge: "Closed",
    statusText: nextOpenText,
    badgeClass: "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/60",
    dotColorClass: "bg-rose-500",
  };
}
