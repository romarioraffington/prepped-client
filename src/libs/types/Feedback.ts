export type ReasonId =
  | "inaccurate_information"
  | "broken_link"
  | "video"
  | "feedback"
  | "other";

export interface ReportReason {
  id: ReasonId;
  label: string;
  placeholder?: string;
}
