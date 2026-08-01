const ACCESS_TOKEN_KEY = "aethermind_access_token";

export const tokenStorage = {
  get(): string | null {
    return window.localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  set(token: string) {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
  },
  remove() {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  },
};

