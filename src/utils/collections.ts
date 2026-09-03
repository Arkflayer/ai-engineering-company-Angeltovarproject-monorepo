export function filterCollection<T>(
  collection: T[],
  predicate: (item: T) => boolean
): T[] {
  return collection.filter(predicate);
}

export function sortCollection<T>(
  collection: T[],
  compareFn: (first: T, second: T) => number
): T[] {
  return [...collection].sort(compareFn);
}

export function groupBy<T>(
  collection: T[],
  keyFn: (item: T) => string
): Record<string, T[]> {
  return collection.reduce<Record<string, T[]>>((groups, item) => {
    const key = keyFn(item);
    (groups[key] ??= []).push(item);
    return groups;
  }, {});
}