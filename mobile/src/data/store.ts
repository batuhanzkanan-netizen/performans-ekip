import { useSyncExternalStore } from "react";
import type { Snapshot } from "../domain/model";
const listeners = new Set<() => void>();
let state: Snapshot = {
  user: null,
  ready: false,
  allowed: false,
  editor: false,
  accessReady: false,
  trainers: [],
  tasks: [],
  online: true,
  loaded: false,
  pending: false,
  cached: true,
  error: "",
  demo: false,
};
export function setState(patch: Partial<Snapshot>) {
  state = { ...state, ...patch };
  listeners.forEach((fn) => fn());
}
export const getState = () => state;
export function useStore() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    getState,
    getState,
  );
}
export function clearSession() {
  setState({
    user: null,
    allowed: false,
    editor: false,
    accessReady: false,
    trainers: [],
    tasks: [],
    loaded: false,
    pending: false,
    cached: true,
    error: "",
  });
}
