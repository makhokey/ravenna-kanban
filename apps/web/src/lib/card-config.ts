import {
  GROUP_BY_VALUES,
  PRIORITY_VALUES,
  STATUS_VALUES,
  type GroupBy,
  type Priority,
  type StatusValue,
} from "@repo/db/constants";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  CircleDashedIcon,
  CircleDotDashedIcon,
  CircleDotIcon,
  CircleIcon,
  EllipsisIcon,
  SignalHighIcon,
  SignalLowIcon,
  SignalMediumIcon,
} from "lucide-react";
import { z } from "zod";

// Re-export domain values for convenience within web app
export { GROUP_BY_VALUES, PRIORITY_VALUES, STATUS_VALUES };
export type { GroupBy, Priority, StatusValue };

// ============================================================================
// UI Constants - Icons, colors, and display metadata
// ============================================================================

export const STATUS_OPTIONS = [
  {
    label: "Backlog",
    value: "backlog",
    icon: CircleDashedIcon,
    color: "text-muted-foreground",
    percent: 0,
    shortcut: "1",
  },
  {
    label: "Todo",
    value: "todo",
    icon: CircleIcon,
    color: "text-muted-foreground",
    percent: 0,
    shortcut: "2",
  },
  {
    label: "In Progress",
    value: "in_progress",
    icon: CircleDotDashedIcon,
    color: "text-yellow-500",
    percent: 50,
    shortcut: "3",
  },
  {
    label: "Review",
    value: "review",
    icon: CircleDotIcon,
    color: "text-blue-500",
    percent: 75,
    shortcut: "4",
  },
  {
    label: "Done",
    value: "done",
    icon: CheckCircle2Icon,
    color: "text-green-500",
    percent: 100,
    shortcut: "5",
  },
] as const;

export const PRIORITY_OPTIONS = [
  { label: "No priority", value: "none", icon: EllipsisIcon, shortcut: "0" },
  { label: "Low", value: "low", icon: SignalLowIcon, shortcut: "1" },
  { label: "Medium", value: "medium", icon: SignalMediumIcon, shortcut: "2" },
  { label: "High", value: "high", icon: SignalHighIcon, shortcut: "3" },
  { label: "Urgent", value: "urgent", icon: AlertTriangleIcon, shortcut: "4" },
] as const;

export const TAG_OPTIONS = [
  { label: "Bug", value: "bug", color: "bg-red-500", shortcut: "1" },
  { label: "Feature", value: "feature", color: "bg-purple-500", shortcut: "2" },
  { label: "Enhancement", value: "enhancement", color: "bg-blue-500", shortcut: "3" },
  {
    label: "Documentation",
    value: "documentation",
    color: "bg-yellow-500",
    shortcut: "4",
  },
  { label: "Refactor", value: "refactor", color: "bg-orange-500", shortcut: "5" },
  { label: "Testing", value: "testing", color: "bg-green-500", shortcut: "6" },
] as const;

// ============================================================================
// Derived Values (for Zod schemas and iteration)
// ============================================================================

export const TAG_VALUES = [
  "bug",
  "feature",
  "enhancement",
  "documentation",
  "refactor",
  "testing",
] as const;

// ============================================================================
// Derived Types
// ============================================================================

export type StatusOption = (typeof STATUS_OPTIONS)[number];
export type PriorityOption = (typeof PRIORITY_OPTIONS)[number];
export type TagValue = (typeof TAG_OPTIONS)[number]["value"];
export type TagOption = (typeof TAG_OPTIONS)[number];

// Priority is now consistent everywhere - "none" is a real value, not null
export type PriorityValue = Priority;

// ============================================================================
// Helper Functions
// ============================================================================

export const getStatusOption = (value: string | null | undefined): StatusOption =>
  STATUS_OPTIONS.find((opt) => opt.value === value) ?? STATUS_OPTIONS[0];

export const getPriorityOption = (value: string): PriorityOption =>
  PRIORITY_OPTIONS.find((opt) => opt.value === value) ?? PRIORITY_OPTIONS[0];

export const getSelectedTags = (values: string[]): TagOption[] =>
  values
    .map((v) => TAG_OPTIONS.find((opt) => opt.value === v))
    .filter((opt): opt is TagOption => opt !== undefined);

export const safeParseJsonTags = (jsonString: string | null | undefined): string[] => {
  if (!jsonString) return [];
  try {
    const parsed = JSON.parse(jsonString);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

// ============================================================================
// Form Schema (Frontend)
// ============================================================================

export const cardFormSchema = z.object({
  title: z
    .string()
    .transform((val) => val.trim())
    .pipe(z.string().min(1, "Title is required")),
  description: z
    .string()
    .optional()
    .transform((val) => val?.trim() || undefined),
  priority: z.enum(PRIORITY_VALUES).default("none"),
  status: z.enum(STATUS_VALUES).default("backlog"),
  tags: z
    .array(z.string())
    .optional()
    // Transform empty array to null (clear) vs undefined (unchanged)
    .transform((val) => (val && val.length > 0 ? val : null)),
});

export type CardFormValues = z.input<typeof cardFormSchema>;
export type CardFormOutput = z.output<typeof cardFormSchema>;

// ============================================================================
// Server Schemas (Backend Validation)
// ============================================================================

export const createCardServerSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  boardId: z.string().min(1, "Board ID is required"),
  status: z.enum(STATUS_VALUES).default("backlog"),
  priority: z.enum(PRIORITY_VALUES).default("none"),
  tags: z.array(z.string()).nullable().optional(),
});

export const updateCardServerSchema = z.object({
  id: z.uuid({ message: "Invalid card ID" }),
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
  priority: z.enum(PRIORITY_VALUES).optional(),
  status: z.enum(STATUS_VALUES).optional(),
  tags: z.array(z.string()).nullable().optional(),
});

export type CreateCardServerInput = z.infer<typeof createCardServerSchema>;
export type UpdateCardServerInput = z.infer<typeof updateCardServerSchema>;
