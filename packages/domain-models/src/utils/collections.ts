// ============================================================
// TrackFlow — Utilidades de colecciones
// ============================================================
// Funciones genéricas para filtrar, ordenar y agrupar arrays
// sin mutar los datos originales.
// ============================================================

/**
 * Filtra los elementos de un array que cumplen con un predicado.
 * No modifica el array original.
 *
 * @param collection - Array de elementos a filtrar.
 * @param predicate - Función que determina si un elemento se conserva.
 * @returns Un nuevo array con los elementos que cumplen el predicado.
 */
export function filterCollection<T>(
  collection: T[],
  predicate: (item: T) => boolean
): T[] {
  return collection.filter(predicate);
}

/**
 * Ordena una copia del array usando un comparador.
 * No modifica el array original.
 *
 * @param collection - Array de elementos a ordenar.
 * @param compareFn - Función de comparación (mismo contrato que Array.prototype.sort).
 * @returns Un nuevo array ordenado.
 */
export function sortCollection<T>(
  collection: T[],
  compareFn: (a: T, b: T) => number
): T[] {
  return [...collection].sort(compareFn);
}

/**
 * Agrupa los elementos de un array según el valor devuelto por `keyFn`.
 *
 * @param collection - Array de elementos a agrupar.
 * @param keyFn - Función que extrae la clave de agrupación de cada elemento.
 * @returns Un objeto Record donde cada clave es un grupo y su valor es el array de elementos.
 */
export function groupBy<T>(
  collection: T[],
  keyFn: (item: T) => string
): Record<string, T[]> {
  const result: Record<string, T[]> = {};

  for (const item of collection) {
    const key = keyFn(item);
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(item);
  }

  return result;
}