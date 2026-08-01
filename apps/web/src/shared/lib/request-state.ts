import { useSyncExternalStore } from "react";

let activeRequests = 0;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function beginRequest() {
  activeRequests += 1;
  notify();
}

export function endRequest() {
  activeRequests = Math.max(0, activeRequests - 1);
  notify();
}

export function useGlobalLoading() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => activeRequests > 0,
    () => false,
  );
}

