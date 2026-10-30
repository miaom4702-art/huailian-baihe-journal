"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

type ThemeMode = "light" | "dark" | "system";

type AppearanceContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  background: string | null;
  setBackground: (value: string | null) => void;
  openSettings: () => void;
};

const THEME_KEY = "hlbh-theme";
const BACKGROUND_KEY = "hlbh-background";
const AppearanceContext = createContext<AppearanceContextValue | null>(null);

function getStoredBackground() {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(BACKGROUND_KEY);
  } catch {
    return null;
  }
}

export function useAppearance() {
  const value = useContext(AppearanceContext);
  if (!value) throw new Error("useAppearance must be used inside AppearanceProvider");
  return value;
}

function PaletteIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M12 3a9 9 0 1 0 0 18h1.1a1.9 1.9 0 0 0 1.5-3.1l-.4-.5a1.9 1.9 0 0 1 1.5-3.1H18a3 3 0 0 0 3-3A9 9 0 0 0 12 3Z" />
      <circle cx="7.5" cy="10" r="1" fill="currentColor" stroke="none" />
      <circle cx="10" cy="6.7" r="1" fill="currentColor" stroke="none" />
      <circle cx="14.3" cy="6.7" r="1" fill="currentColor" stroke="none" />
      <circle cx="17" cy="10" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("图片读取失败"));
    };
    image.src = url;
  });
}

async function compressBackground(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("请选择 JPG、PNG 或 WebP 图片");
  }
  if (file.size > 12 * 1024 * 1024) {
    throw new Error("背景图片不能超过 12MB");
  }

  const image = await loadImage(file);
  const maxSide = 1800;
  const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("浏览器无法处理这张图片");

  context.fillStyle = "#f7fbfd";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
  if (dataUrl.length > 4_200_000) {
    throw new Error("图片压缩后仍然过大，请换一张尺寸小一点的图片");
  }
  return dataUrl;
}

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("light");
  const [background, setBackgroundState] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem(THEME_KEY);
      if (storedTheme === "dark" || storedTheme === "system" || storedTheme === "light") {
        setModeState(storedTheme);
      }
      setBackgroundState(getStoredBackground());
    } catch {
      // storage may be unavailable
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;

    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = mode === "dark" || (mode === "system" && media.matches);
      root.classList.toggle("dark", dark);
      root.dataset.theme = dark ? "dark" : "light";
      root.style.colorScheme = dark ? "dark" : "light";
      const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
      if (meta) meta.content = dark ? "#0d161a" : "#f7fbfd";
    };

    apply();
    if (mode === "system") {
      media.addEventListener("change", apply);
      return () => media.removeEventListener("change", apply);
    }
  }, [mode, ready]);

  useEffect(() => {
    if (!ready) return;
    const root = document.documentElement;
    if (background) {
      root.style.setProperty("--site-background", `url("${background}")`);
      root.classList.add("has-custom-bg");
    } else {
      root.style.removeProperty("--site-background");
      root.classList.remove("has-custom-bg");
    }
  }, [background, ready]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const setMode = useCallback((nextMode: ThemeMode) => {
    setModeState(nextMode);
    try {
      localStorage.setItem(THEME_KEY, nextMode);
    } catch {
      // ignore
    }
  }, []);

  const setBackground = useCallback((value: string | null) => {
    setBackgroundState(value);
    try {
      if (value) localStorage.setItem(BACKGROUND_KEY, value);
      else localStorage.removeItem(BACKGROUND_KEY);
    } catch {
      // ignore
    }
  }, []);

  const handleUpload = async (file: File | undefined) => {
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const dataUrl = await compressBackground(file);
      setBackground(dataUrl);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "背景上传失败");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <AppearanceContext.Provider
      value={{ mode, setMode, background, setBackground, openSettings: () => setOpen(true) }}
    >
      {children}
      <div className="site-background" aria-hidden="true" />

      {open && (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-ink-950/45 p-3 backdrop-blur-sm sm:items-center sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="外观与背景设置"
            className="card max-h-[90dvh] w-full max-w-md overflow-y-auto p-5 sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-serif text-xl text-ink-900">外观与背景</p>
                <p className="mt-1 text-[11px] leading-5 text-ink-700/60">
                  只保存在当前设备浏览器，不会上传到服务器。
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-900/5 text-xl leading-none text-ink-700/60 hover:text-ink-900"
                aria-label="关闭外观设置"
              >
                ×
              </button>
            </div>

            <section className="mt-5">
              <p className="text-[11px] font-semibold tracking-wide text-ink-900">夜间模式</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {[
                  { value: "light" as const, label: "浅色" },
                  { value: "dark" as const, label: "深色" },
                  { value: "system" as const, label: "跟随系统" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setMode(option.value)}
                    className={`rounded-sm border px-2 py-2 text-xs transition ${
                      mode === option.value
                        ? "border-crimson-600 bg-crimson-600 text-white"
                        : "border-ink-900/15 text-ink-700 hover:border-crimson-600/35"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </section>

            <section className="mt-5 border-t border-ink-900/10 pt-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold tracking-wide text-ink-900">自定义布景</p>
                  <p className="mt-1 text-[10px] leading-5 text-ink-700/55">
                    上传照片作为网页背景，建议使用横向图片。
                  </p>
                </div>
                {background && (
                  <button
                    type="button"
                    onClick={() => setBackground(null)}
                    className="shrink-0 text-[10px] text-crimson-600 hover:underline"
                  >
                    恢复默认
                  </button>
                )}
              </div>

              <div
                className="mt-3 flex min-h-32 items-center justify-center overflow-hidden rounded-sm border border-ink-900/10 bg-paper-100"
                style={
                  background
                    ? { backgroundImage: `url("${background}")`, backgroundSize: "cover", backgroundPosition: "center" }
                    : undefined
                }
              >
                {!background && (
                  <span className="px-4 py-8 text-[11px] text-ink-700/45">还没有自定义背景</span>
                )}
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(event) => void handleUpload(event.target.files?.[0])}
              />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                className="btn-outline mt-3 w-full !py-2 text-xs disabled:opacity-50"
              >
                {uploading ? "正在处理照片…" : background ? "更换背景照片" : "上传背景照片"}
              </button>
              {uploadError && (
                <p className="mt-2 text-[10px] leading-5 text-crimson-700">{uploadError}</p>
              )}
            </section>
          </div>
        </div>
      )}
    </AppearanceContext.Provider>
  );
}

export function AppearanceMenu() {
  const { openSettings } = useAppearance();
  return (
    <button
      type="button"
      onClick={openSettings}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-ink-900/15 text-ink-700/75 transition hover:border-crimson-600/30 hover:text-crimson-600"
      aria-label="外观与背景设置"
      title="外观与背景"
    >
      <PaletteIcon />
    </button>
  );
}
