/**
 * Generate a 3-character prefix from board name
 * - "My Project" → "MYP" (first letter of each word)
 * - "Bugs" → "BUG" (first 3 letters)
 * - "AI" → "AI" (if < 3 chars, use as-is uppercase)
 */
export function generatePrefix(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return "RAV"; // Default fallback
  }

  if (words.length >= 3) {
    // Take first letter of first 3 words
    return words
      .slice(0, 3)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
  } else if (words.length === 2) {
    // Two words: first letter of first + first 2 of second
    return (words[0]![0] + words[1]!.slice(0, 2)).toUpperCase();
  } else {
    // Single word: first 3 characters (or less if word is shorter)
    return name.trim().slice(0, 3).toUpperCase();
  }
}
