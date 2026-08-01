function requiredText(value: string | undefined, fallback: string, name: string) {
  const resolved = value?.trim() || fallback;
  if (!resolved) throw new Error(`${name} must not be empty`);
  return resolved;
}

function apiUrl(value: string | undefined) {
  const resolved = requiredText(value, "http://localhost:4000/api/v1", "VITE_API_URL");

  try {
    new URL(resolved);
  } catch {
    throw new Error("VITE_API_URL must be a valid absolute URL");
  }

  return resolved;
}

export const env = Object.freeze({
  apiUrl: apiUrl(import.meta.env.VITE_API_URL),
  appName: requiredText(import.meta.env.VITE_APP_NAME, "AetherMind", "VITE_APP_NAME"),
  version: requiredText(import.meta.env.VITE_APP_VERSION, "1.0.0", "VITE_APP_VERSION"),
});

export type AppEnv = typeof env;

