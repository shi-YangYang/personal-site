type Listener = (open: boolean) => void;

let isOpen = false;
const listeners = new Set<Listener>();

export const terminalStore = {
  get() {
    return isOpen;
  },
  set(value: boolean) {
    if (value === isOpen) return;
    isOpen = value;
    listeners.forEach((l) => l(value));
  },
  toggle() {
    terminalStore.set(!isOpen);
  },
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
