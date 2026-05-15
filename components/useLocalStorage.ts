"use client";

import { useCallback } from "react";

export function useLocalStorage<T>(key: string) {
  const save = useCallback(
    (value: T) => {
      window.localStorage.setItem(key, JSON.stringify(value));
    },
    [key]
  );

  const load = useCallback((): T | null => {
    const item = window.localStorage.getItem(key);
    if (!item) return null;

    try {
      return JSON.parse(item) as T;
    } catch {
      return null;
    }
  }, [key]);

  return { save, load };
}
