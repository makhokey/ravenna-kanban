import {
  EllipsisIcon,
  SignalHighIcon,
  SignalLowIcon,
  SignalMediumIcon,
} from "lucide-react";
import { z } from "zod";

// ============================================================================
// Constants - Single source of truth for priority and tag options
// ============================================================================

export const PRIORITY_OPTIONS = [
  { label: "No priority", value: "no priority", icon: EllipsisIcon, shortcut: "0" },
  { label: "Low", value: "low", icon: SignalLowIcon, shortcut: "1" },
  { label: "Medium", value: "medium", icon: SignalMediumIcon, shortcut: "2" },
  { label: "High", value: "high", icon: SignalHighIcon, shortcut: "3" },
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
// Derived Types
// ============================================================================

export type PriorityValue = (typeof PRIORITY_OPTIONS)[number]["value"];
export type PriorityOption = (typeof PRIORITY_OPTIONS)[number];
export type TagValue = (typeof TAG_OPTIONS)[number]["value"];
export type TagOption = (typeof TAG_OPTIONS)[number];

// Database priority (excludes "no priority" sentinel)
export type Priority = Exclude<PriorityValue, "no priority">;

// ============================================================================
// Helper Functions
// ============================================================================

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
  priority: z
    .enum(["no priority", "low", "medium", "high"])
    .default("no priority")
    // Transform "no priority" to null (clear) vs undefined (unchanged)
    .transform((val) => (val === "no priority" ? null : val)),
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
  columnId: z.string().min(1, "Column ID is required"),
  priority: z.enum(["low", "medium", "high"]).optional(),
  tags: z.array(z.string()).optional(),
});

export const updateCardServerSchema = z.object({
  id: z.uuid({ message: "Invalid card ID" }),
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
  // null = clear, undefined = unchanged
  priority: z.enum(["low", "medium", "high"]).nullable().optional(),
  // null = clear, undefined = unchanged
  tags: z.array(z.string()).nullable().optional(),
});

export type CreateCardServerInput = z.infer<typeof createCardServerSchema>;
export type UpdateCardServerInput = z.infer<typeof updateCardServerSchema>;
