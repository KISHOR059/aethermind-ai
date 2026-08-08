export type AuthSyncEvent = "logout" | "session-expired";

const CHANNEL_NAME = "aethermind_auth_sync";
const STORAGE_KEY = "aethermind_auth_sync_event";

type AuthSyncPayload = {
  type: AuthSyncEvent;
  timestamp: number;
  senderId: string;
};

const TAB_ID = crypto.randomUUID();

let channel: BroadcastChannel | null = null;

function createChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === "undefined") {
    return null;
  }

  try {
    return new BroadcastChannel(CHANNEL_NAME);
  } catch {
    return null;
  }
}

function writeStorageEvent(type: AuthSyncEvent) {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ type, timestamp: Date.now(), senderId: TAB_ID }),
    );
  } catch {
    // Storage may be unavailable; the BroadcastChannel path still works.
  }
}

export function broadcastAuthSync(type: AuthSyncEvent) {
  if (!channel) {
    channel = createChannel();
  }

  channel?.postMessage({ type, timestamp: Date.now(), senderId: TAB_ID });
  writeStorageEvent(type);
}

export function subscribeAuthSync(
  listener: (type: AuthSyncEvent) => void,
): () => void {
  const onMessage = (event: MessageEvent<AuthSyncPayload>) => {
    if (event.data?.senderId === TAB_ID || !event.data?.type) {
      return;
    }

    listener(event.data.type);
  };

  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY || !event.newValue) {
      return;
    }

    try {
      const payload = JSON.parse(event.newValue) as AuthSyncPayload;

      if (payload.senderId === TAB_ID || !payload.type) {
        return;
      }

      listener(payload.type);
    } catch {
      // Ignore malformed storage payloads.
    }
  };

  if (!channel) {
    channel = createChannel();
  }

  channel?.addEventListener("message", onMessage);
  window.addEventListener("storage", onStorage);

  return () => {
    channel?.removeEventListener("message", onMessage);
    window.removeEventListener("storage", onStorage);
  };
}
