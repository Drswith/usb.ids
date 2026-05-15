const STORAGE_KEY = "usb-ids-theme";

export type ThemeMode = "light" | "dark";

function getStoredTheme(): ThemeMode | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark") return v;
  } catch {
    /* private mode */
  }
  return null;
}

function systemPrefersDark(): boolean {
  return globalThis.matchMedia?.("(prefers-color-scheme: dark)").matches ?? true;
}

export function getEffectiveTheme(): ThemeMode {
  return getStoredTheme() ?? (systemPrefersDark() ? "dark" : "light");
}

export function applyTheme(mode: ThemeMode): void {
  document.documentElement.dataset.theme = mode;
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
}

export function initTheme(): ThemeMode {
  const mode = getEffectiveTheme();
  document.documentElement.dataset.theme = mode;

  globalThis.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    if (getStoredTheme() !== null) return;
    document.documentElement.dataset.theme = e.matches ? "dark" : "light";
  });

  return mode;
}

export function toggleTheme(current: ThemeMode): ThemeMode {
  const next: ThemeMode = current === "dark" ? "light" : "dark";
  applyTheme(next);
  return next;
}
