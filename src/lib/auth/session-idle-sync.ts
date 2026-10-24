import { SESSION_IDLE_CHANNEL, SESSION_IDLE_STORAGE_KEY } from "./constants";

export type SessionIdleMessage =
  | { type: "activity"; at: number }
  | { type: "extend"; at: number }
  | { type: "logout"; at: number };

export function readStoredActivity(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_IDLE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeStoredActivity(at: number) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SESSION_IDLE_STORAGE_KEY, String(at));
  } catch {
    // ignore quota / private mode
  }
}

export function createSessionIdleBroadcaster(onMessage: (message: SessionIdleMessage) => void) {
  if (typeof window === "undefined") {
    return { publish: () => undefined, close: () => undefined };
  }

  let channel: BroadcastChannel | null = null;
  try {
    channel = new BroadcastChannel(SESSION_IDLE_CHANNEL);
    channel.onmessage = (event) => {
      const data = event.data as SessionIdleMessage;
      if (!data || typeof data.type !== "string") return;
      onMessage(data);
    };
  } catch {
    channel = null;
  }

  function publish(message: SessionIdleMessage) {
    writeStoredActivity(message.at);
    channel?.postMessage(message);
  }

  return {
    publish,
    close: () => channel?.close(),
  };
}
