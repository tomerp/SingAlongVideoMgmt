/**
 * Hebrew-aware sorting using Intl.Collator.
 * Use for sorting arrays of strings or objects by a string field.
 */
const hebrewCollator = new Intl.Collator("he", { sensitivity: "base" });

export function sortHebrew(a: string, b: string): number {
  return hebrewCollator.compare(a, b);
}

export function sortByHebrew<T>(
  items: T[],
  getKey: (item: T) => string
): T[] {
  return [...items].sort((a, b) =>
    hebrewCollator.compare(getKey(a), getKey(b))
  );
}
