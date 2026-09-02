// ============================================================
// TrackFlow — Algoritmos de búsqueda
// ============================================================
// Búsqueda lineal para arrays desordenados y búsqueda binaria
// para arrays previamente ordenados. Ambas devuelven el
// elemento encontrado o undefined.
// ============================================================

/**
 * Busca un elemento en un array mediante búsqueda lineal.
 * Recorre el array desde el inicio hasta que el predicado se cumple.
 *
 * @param collection - Array donde buscar (no necesita estar ordenado).
 * @param predicate - Función que determina si el elemento es el buscado.
 * @returns El primer elemento que cumple el predicado, o `undefined` si no se encuentra.
 */
export function linearSearch<T>(
  collection: T[],
  predicate: (item: T) => boolean
): T | undefined {
  for (const item of collection) {
    if (predicate(item)) {
      return item;
    }
  }
  return undefined;
}

/**
 * Busca un elemento en un array ordenado mediante búsqueda binaria.
 * El array debe estar ordenado según el mismo criterio que usa `compareFn`.
 *
 * @param collection - Array ordenado donde buscar.
 * @param target - Elemento a buscar.
 * @param compareFn - Función que compara dos elementos.
 *   Debe devolver 0 si son iguales, < 0 si a < b, > 0 si a > b.
 * @returns El elemento encontrado, o `undefined` si no existe.
 */
export function binarySearch<T>(
  collection: T[],
  target: T,
  compareFn: (a: T, b: T) => number
): T | undefined {
  if (collection.length === 0) return undefined;

  let left = 0;
  let right = collection.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const comparison = compareFn(collection[mid], target);

    if (comparison === 0) {
      return collection[mid];
    } else if (comparison < 0) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return undefined;
}