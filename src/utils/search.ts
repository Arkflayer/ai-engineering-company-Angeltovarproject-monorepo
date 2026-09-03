export function linearSearch<T>(
  collection: T[],
  predicate: (item: T) => boolean
): T | undefined {
  return collection.find(predicate);
}

export function binarySearch<T>(
  collection: T[],
  target: T,
  compareFn: (first: T, second: T) => number
): T | undefined {
  let left = 0;
  let right = collection.length - 1;

  while (left <= right) {
    const middle = Math.floor((left + right) / 2);
    const comparison = compareFn(collection[middle], target);

    if (comparison === 0) return collection[middle];
    if (comparison < 0) left = middle + 1;
    else right = middle - 1;
  }

  return undefined;
}