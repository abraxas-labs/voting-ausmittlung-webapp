/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { NumberUtil } from '@abraxas/voting-lib';

export function groupBySingle<E, K extends keyof any, V>(
  arr: E[],
  keySelector: (item: E) => K,
  itemSelector: (item: E) => V,
): Record<K, V> {
  return arr.reduce(
    (existing, current) => {
      const key = keySelector(current);
      existing[key] = itemSelector(current);
      return existing;
    },
    {} as Record<K, V>,
  );
}

export function groupBy<E, K extends keyof any, V>(arr: E[], keySelector: (item: E) => K, itemSelector: (item: E) => V): Record<K, V[]> {
  return arr.reduce(
    (existing, current) => {
      const key = keySelector(current);
      if (!existing.hasOwnProperty(key)) {
        existing[key] = [];
      }
      existing[key].push(itemSelector(current));
      return existing;
    },
    {} as Record<K, V[]>,
  );
}

export function toMap<E, K, V>(arr: E[], keySelector: (item: E) => K, valueSelector: (item: E) => V): Map<K, V> {
  const map = new Map<K, V>();
  for (const item of arr) {
    map.set(keySelector(item), valueSelector(item));
  }
  return map;
}

export function distinct<E, V>(arr: E[], propSelector: (item: E) => V): E[] {
  const resultSet: Set<V> = new Set();
  const result: E[] = [];
  for (const el of arr) {
    const prop = propSelector(el);
    if (!resultSet.has(prop)) {
      resultSet.add(prop);
      result.push(el);
    }
  }
  return result;
}

export function flatten<E>(arr: E[][]): E[] {
  return Array.prototype.concat(...arr);
}

export function sum<E>(arr: E[], propSelector: (item: E) => number | undefined): number {
  return arr.reduce((v, x) => v + NumberUtil.getNumberOrZero(propSelector(x)), 0);
}

export function splitArray<E>(arr: E[], filter: (item: E) => boolean): [E[], E[]] {
  const truthy: E[] = [];
  const falsy: E[] = [];
  for (const element of arr) {
    if (filter(element)) {
      truthy.push(element);
    } else {
      falsy.push(element);
    }
  }
  return [truthy, falsy];
}

export function arraysEqual<T>(a: T[], b: T[]): boolean {
  if (a === b) {
    return true;
  }

  if (a == null || b == null || a.length !== b.length) {
    return false;
  }

  for (let i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) {
      return false;
    }
  }

  return true;
}
