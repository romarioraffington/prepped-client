/**
 * Formats a time string from 24-hour format to 12-hour format with AM/PM
 * @param timeString - Time in "HH:mm:ss" format (e.g., "09:30:00", "17:45:00")
 * @returns Formatted time in "h:mm AM/PM" format (e.g., "9:30 AM", "5:45 PM")
 *
 * @example
 * formatTime("09:30:00") // returns "9:30 AM"
 * formatTime("17:45:00") // returns "5:45 PM"
 * formatTime("00:15:00") // returns "12:15 AM"
 * formatTime("12:00:00") // returns "12:00 PM"
 */
export const formatTime = (timeString: string): string => {
  const [hours, minutes] = timeString.split(":");
  const hour24 = Number.parseInt(hours, 10);
  const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
  const ampm = hour24 >= 12 ? "PM" : "AM";
  return `${hour12}:${minutes} ${ampm}`;
};

/**
 * Checks if hours data is valid and available
 * @param hours - Hours object with isOpen, opensAt, closedAt, and is24Hours properties
 * @returns true if hours data is valid, false otherwise
 *
 * @example
 * hasValidHours({ isOpen: true, opensAt: "09:00", closedAt: "17:00", is24Hours: false }) // returns true
 * hasValidHours({ isOpen: null, opensAt: null, closedAt: null, is24Hours: false }) // returns false
 */
export const hasValidHours = (hours: {
  isOpen: boolean | null;
  opensAt: string | null;
  closedAt: string | null;
  is24Hours: boolean;
}): boolean => {
  return (
    hours.isOpen !== null ||
    hours.opensAt !== null ||
    hours.closedAt !== null ||
    hours.is24Hours === true
  );
};
