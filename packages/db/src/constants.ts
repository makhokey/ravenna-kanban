export const STATUS_VALUES = [
  "backlog",
  "todo",
  "in_progress",
  "review",
  "done",
] as const;

// "none" is a real value, not null - simplifies all priority handling
export const PRIORITY_VALUES = ["none", "low", "medium", "high", "urgent"] as const;
export const GROUP_BY_VALUES = ["status", "priority"] as const;

export type StatusValue = (typeof STATUS_VALUES)[number];
export type Priority = (typeof PRIORITY_VALUES)[number];
export type GroupBy = (typeof GROUP_BY_VALUES)[number];
