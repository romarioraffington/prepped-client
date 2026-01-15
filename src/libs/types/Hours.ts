export type Hours = {
  isOpen: boolean;
  opensAt: string;
  closedAt: string;
  is24Hours: boolean;
  dailyHours?: { day: string; hours: string }[]; // TODO: Determine if this is needed
};
