const LAST_ACTIVITY_KEY = "aethermind_last_activity";
const THROTTLE_MS = 30_000;

const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "touchstart",
  "scroll",
  "click",
] as const;

let lastWriteAt = 0;

function read(): number {
  try {
    const stored = window.localStorage.getItem(LAST_ACTIVITY_KEY);
    const value = stored ? Number(stored) : NaN;

    return Number.isFinite(value) ? value : Date.now();
  } catch {
    return Date.now();
  }
}

function write(timestamp: number) {
  lastWriteAt = timestamp;

  try {
    window.localStorage.setItem(LAST_ACTIVITY_KEY, String(timestamp));
  } catch {
    // Storage may be unavailable; the in-memory timestamp still works.
  }
}

function handleActivity() {
  const now = Date.now();

  if (now - lastWriteAt < THROTTLE_MS) {
    return;
  }

  write(now);
}

function handleVisibilityChange() {
  if (document.visibilityState === "visible") {
    write(Date.now());
  }
}

export const sessionActivity = {
  init(): () => void {
    lastWriteAt = read();

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, handleActivity, { passive: true });
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, handleActivity);
      }

      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  },
  touch() {
    write(Date.now());
  },
  getLastActivity(): number {
    return read();
  },
  reset() {
    lastWriteAt = 0;

    try {
      window.localStorage.removeItem(LAST_ACTIVITY_KEY);
    } catch {
      // Ignore storage failures during cleanup.
    }
  },
};
