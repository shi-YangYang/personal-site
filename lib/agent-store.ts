export type AgentRequest = {
  id: number;
  question: string;
};

export type AgentState = {
  open: boolean;
  request: AgentRequest | null;
};

let state: AgentState = { open: false, request: null };
let sequence = 0;
const listeners = new Set<(state: AgentState) => void>();

function emit() {
  for (const listener of listeners) listener(state);
}

export const agentStore = {
  subscribe(listener: (state: AgentState) => void) {
    listeners.add(listener);
    listener(state);
    return () => {
      listeners.delete(listener);
    };
  },
  get() {
    return state;
  },
  open(question?: string) {
    sequence += 1;
    state = {
      open: true,
      request: question
        ? { id: sequence, question: question.trim() }
        : null,
    };
    emit();
  },
  close() {
    state = { open: false, request: null };
    emit();
  },
  toggle() {
    if (state.open) this.close();
    else this.open();
  },
};
