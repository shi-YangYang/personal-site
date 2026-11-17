type Listener = (id: string) => void;

let activeId = "";
const listeners = new Set<Listener>();

export const activeSectionStore = {
  get() {
    return activeId;
  },
  set(id: string) {
    if (id === activeId) return;
    activeId = id;
    listeners.forEach((l) => l(id));
  },
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
