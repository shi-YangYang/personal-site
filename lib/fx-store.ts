let active = false;
const listeners = new Set<(active: boolean) => void>();

function emit() {
  for (const listener of listeners) listener(active);
}

export const fxStore = {
  subscribe(listener: (active: boolean) => void) {
    listeners.add(listener);
    listener(active);
    return () => {
      listeners.delete(listener);
    };
  },
  get() {
    return active;
  },
  toggle() {
    active = !active;
    emit();
  },
};
