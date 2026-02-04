/**
 * Generate a URL-friendly slug from text.
 * - Converts to lowercase
 * - Replaces spaces with hyphens
 * - Removes special characters
 * - Limits length to 50 characters
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special chars except hyphens
    .replace(/\s+/g, "-") // Spaces to hyphens
    .replace(/-+/g, "-") // Collapse multiple hyphens
    .replace(/^-|-$/g, "") // Remove leading/trailing hyphens
    .substring(0, 50);
}
