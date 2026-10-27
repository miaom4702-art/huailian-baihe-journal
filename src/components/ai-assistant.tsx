"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import type { AssistantMood } from "@/lib/assistant-persona";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type Live2DHandle = {
  destroy: () => void;
  setMood: (mood: AssistantMood) => void;
  setSpeaking: (speaking: boolean) => void;
  focus: (x: number, y: number) => void;
};

const STORAGE_KEY = "hlbh-assistant-history-v1";
const GREETING =
  "晚上好，或者……无论你现在是什么时间，都欢迎来到「月读」。我是八千代。想聊聊文章、写作，还是只想在这里安静一会儿？";

const MOOD_LABELS: Record<AssistantMood, string> = {
  neutral: "安静地听着",
  happy: "心情很好",
  sad: "有些心疼",
  touched: "被温柔到了",
  playful: "想逗逗你",
  angry: "有点认真",
  surprised: "有些惊讶",
  loving: "在悄悄关心你",
};

const SCRIPT_URLS = [
  "/vendor/pixi.min.js",
  "/vendor/pixi-unsafe-eval.min.js",
  "/vendor/live2dcubismcore.min.js",
  "/vendor/pixi-live2d-display.min.js",
];

let live2dLoader: Promise<any> | null = null;

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[data-hlbh-live2d="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === "true") resolve();
      else {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error("Live2D 脚本加载失败")), {
          once: true,
        });
      }
      return;
    }

    const script = document.createElement("script");
    const nonce = document.querySelector<HTMLScriptElement>("script[nonce]")?.nonce;
    if (nonce) script.nonce = nonce;
    script.src = src;
    script.async = false;
    script.dataset.hlbhLive2d = src;
    script.addEventListener(
      "load",
      () => {
        script.dataset.loaded = "true";
        resolve();
      },
      { once: true },
    );
    script.addEventListener("error", () => reject(new Error("Live2D 脚本加载失败")), {
      once: true,
    });
    document.head.appendChild(script);
  });
}

async function loadLive2D() {
  if ((window as any).PIXI?.live2d?.Live2DModel) return (window as any).PIXI;
  if (!live2dLoader) {
    live2dLoader = (async () => {
      for (const src of SCRIPT_URLS) {
        await loadScript(src);
      }
      const pixi = (window as any).PIXI;
      if (!pixi?.live2d?.Live2DModel) {
        throw new Error("Live2D 运行库未初始化");
      }
      return pixi;
    })().catch((error) => {
      live2dLoader = null;
      throw error;
    });
  }
  return live2dLoader;
}

const EXPRESSION_IDS = [
  "ParamExpression_1",
  "ParamExpression_2",
  "ParamExpression_3",
  "ParamExpression_4",
  "ParamHide_EyesL1",
  "ParamHighLightHide_EyesL1",
  "ParamHide_EyeSocket",
  "ParamHide_EyeSocket2",
];

function expressionTarget(mood: AssistantMood) {
  const values: Record<string, number> = {};
  for (const id of EXPRESSION_IDS) values[id] = 0;

  if (mood === "happy" || mood === "loving") {
    values.ParamExpression_3 = 1;
    values.ParamHide_EyesL1 = 1;
    values.ParamHighLightHide_EyesL1 = 1;
    values.ParamHide_EyeSocket = 1;
    values.ParamHide_EyeSocket2 = 1;
  } else if (mood === "playful") {
    values.ParamExpression_4 = 1;
    values.ParamHide_EyesL1 = 1;
    values.ParamHighLightHide_EyesL1 = 1;
    values.ParamHide_EyeSocket = 1;
    values.ParamHide_EyeSocket2 = 1;
  } else if (mood === "sad") {
    values.ParamExpression_1 = 1;
  } else if (mood === "touched") {
    values.ParamExpression_2 = 1;
  }

  return values;
}

async function createLive2D(canvas: HTMLCanvasElement): Promise<Live2DHandle> {
  const PIXI = await loadLive2D();
  const stage = canvas.parentElement ?? canvas;
  const app = new PIXI.Application({
    view: canvas,
    width: Math.max(1, stage.clientWidth),
    height: Math.max(1, stage.clientHeight),
    backgroundAlpha: 0,
    antialias: true,
    autoDensity: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    powerPreference: "high-performance",
  });

  const model = await PIXI.live2d.Live2DModel.from("/live2d/yachiyo/model.model3.json", {
    autoInteract: false,
    autoUpdate: true,
  });

  app.stage.addChild(model);

  const idleRef = {
    mood: "neutral" as AssistantMood,
    speaking: false,
    focusX: 0,
    focusY: 0,
    expression: expressionTarget("neutral"),
    destroy: false,
  };

  const modelBaseWidth = Math.max(1, model.width);

  const layout = () => {
    const width = Math.max(1, stage.clientWidth);
    const height = Math.max(1, stage.clientHeight);
    app.renderer.resize(width, height);

    const scale = (width / modelBaseWidth) * 1.02;

    if (model.anchor?.set) model.anchor.set(0.5, 0);
    model.scale.set(scale);
    model.x = width / 2;
    model.y = -4;
  };

  layout();

  const resizeObserver = new ResizeObserver(layout);
  resizeObserver.observe(stage);

  const coreModel = model.internalModel?.coreModel;
  const updateHandler = () => {
    if (idleRef.destroy || !coreModel?.setParameterValueById) return;

    const now = performance.now() / 1000;
    const focusX = idleRef.focusX;
    const focusY = idleRef.focusY;
    const expression = idleRef.expression;

    const blinkPhase = now % 4.7;
    const blink = blinkPhase > 4.5 ? Math.max(0.08, Math.abs(blinkPhase - 4.6) / 0.1) : 1;
    const breath = (Math.sin(now * 1.15) + 1) / 2;
    const mouth = idleRef.speaking
      ? Math.max(0, Math.abs(Math.sin(now * 10.5)) * 0.72 + 0.06)
      : 0;

    const headX = Math.sin(now * 0.55) * 6 + focusX * 18;
    const headY = Math.sin(now * 0.73 + 1.2) * 4 - focusY * 10;

    coreModel.setParameterValueById("ParamAngleX", headX);
    coreModel.setParameterValueById("ParamAngleY", headY);
    coreModel.setParameterValueById("ParamAngleZ", Math.sin(now * 0.43) * 2);
    coreModel.setParameterValueById("ParamBodyAngleX", Math.sin(now * 0.47) * 3);
    coreModel.setParameterValueById("ParamBodyAngleY", Math.sin(now * 0.61) * 1.5);
    coreModel.setParameterValueById("ParamBreath", breath);
    coreModel.setParameterValueById("ParamEyeBallX", focusX * 0.8);
    coreModel.setParameterValueById("ParamEyeBallY", -focusY * 0.6);
    coreModel.setParameterValueById("ParamEyeLOpen", blink);
    coreModel.setParameterValueById("ParamEyeROpen", blink);
    coreModel.setParameterValueById("ParamMouthOpenY", mouth);
    coreModel.setParameterValueById(
      "ParamMouthForm",
      idleRef.mood === "angry"
        ? -0.45
        : idleRef.mood === "sad"
          ? -0.18
          : idleRef.mood === "happy" || idleRef.mood === "loving" || idleRef.mood === "playful"
            ? 0.75
            : 0,
    );
    coreModel.setParameterValueById(
      "ParamBrowLY",
      idleRef.mood === "angry" ? -0.55 : idleRef.speaking ? 0.08 : 0,
    );
    coreModel.setParameterValueById(
      "ParamBrowRY",
      idleRef.mood === "angry" ? -0.55 : idleRef.speaking ? 0.08 : 0,
    );

    for (const id of EXPRESSION_IDS) {
      const target = expression[id] ?? 0;
      const current =
        typeof coreModel.getParameterValueById === "function"
          ? coreModel.getParameterValueById(id)
          : target;
      const safeCurrent = Number.isFinite(current) ? current : target;
      coreModel.setParameterValueById(id, safeCurrent + (target - safeCurrent) * 0.06);
    }
  };

  if (model.internalModel?.on) {
    model.internalModel.on("beforeModelUpdate", updateHandler);
  }

  return {
    destroy() {
      idleRef.destroy = true;
      resizeObserver.disconnect();
      if (model.internalModel?.off) {
        model.internalModel.off("beforeModelUpdate", updateHandler);
      }
      model.destroy();
      app.destroy(true, { children: true });
    },
    setMood(mood) {
      idleRef.mood = mood;
      idleRef.expression = expressionTarget(mood);
    },
    setSpeaking(speaking) {
      idleRef.speaking = speaking;
    },
    focus(x, y) {
      idleRef.focusX = Math.max(-1, Math.min(1, x));
      idleRef.focusY = Math.max(-1, Math.min(1, y));
    },
  };
}

function speakText(text: string, onSpeaking: (speaking: boolean) => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text.replace(/[*#`>]/g, ""));
  utterance.lang = "zh-CN";
  utterance.rate = 1.04;
  utterance.pitch = 1.08;

  const voices = window.speechSynthesis.getVoices();
  const voice =
    voices.find((item) => item.lang === "zh-CN" && /female|女|Xiaoxiao|Xiaoyi/i.test(item.name)) ??
    voices.find((item) => item.lang.startsWith("zh"));
  if (voice) utterance.voice = voice;

  utterance.onstart = () => onSpeaking(true);
  utterance.onend = () => onSpeaking(false);
  utterance.onerror = () => onSpeaking(false);
  window.speechSynthesis.speak(utterance);
}

export function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelState, setModelState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [voiceOn, setVoiceOn] = useState(false);
  const [mood, setMood] = useState<AssistantMood>("neutral");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const live2dRef = useRef<Live2DHandle | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  const loadingRef = useRef(false);
  const voiceOnRef = useRef(false);
  const moodRef = useRef<AssistantMood>("neutral");

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("assistant") === "1") {
      setOpen(true);
    }
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as ChatMessage[];
        if (Array.isArray(saved) && saved.length > 0) {
          setMessages(saved.slice(-20));
          messagesRef.current = saved.slice(-20);
          return;
        }
      }
    } catch {
      // ignore malformed local history
    }

    const greeting: ChatMessage = {
      id: "greeting",
      role: "assistant",
      content: GREETING,
    };
    setMessages([greeting]);
    messagesRef.current = [greeting];
  }, []);

  useEffect(() => {
    messagesRef.current = messages;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-20)));
    } catch {
      // storage can be unavailable in private mode
    }
  }, [messages]);

  useEffect(() => {
    voiceOnRef.current = voiceOn;
    moodRef.current = mood;
    if (!voiceOn && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      live2dRef.current?.setSpeaking(false);
    }
  }, [voiceOn, mood]);

  useEffect(() => {
    if (!open) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      return;
    }

    const timer = window.setTimeout(() => inputRef.current?.focus(), 250);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !canvasRef.current) return;

    let cancelled = false;
    setModelState("loading");
    const canvas = canvasRef.current;

    createLive2D(canvas)
      .then((handle) => {
        if (cancelled) {
          handle.destroy();
          return;
        }
        live2dRef.current = handle;
        handle.setMood(moodRef.current);
        setModelState("ready");
      })
      .catch((loadError) => {
        console.error("[assistant] Live2D failed", loadError);
        if (!cancelled) setModelState("error");
      });

    return () => {
      cancelled = true;
      live2dRef.current?.destroy();
      live2dRef.current = null;
    };
  }, [open]);

  useEffect(() => {
    const node = listRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, loading, error]);

  const setMoodAndLive2D = useCallback((nextMood: AssistantMood) => {
    setMood(nextMood);
    live2dRef.current?.setMood(nextMood);
  }, []);

  const handleSpeaking = useCallback((speaking: boolean) => {
    live2dRef.current?.setSpeaking(speaking);
  }, []);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loadingRef.current) return;

    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
    };
    const nextMessages = [...messagesRef.current, userMessage].slice(-20);

    setInput("");
    setError(null);
    setMessages(nextMessages);
    loadingRef.current = true;
    setLoading(true);

    try {
      const response = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.slice(-12).map(({ role, content }) => ({
            role,
            content,
          })),
        }),
      });
      const result = (await response.json()) as {
        reply?: string;
        mood?: AssistantMood;
        error?: string;
      };

      if (!response.ok || !result.reply) {
        setError(result.error ?? "八千代暂时没有回应，请稍后再试");
        return;
      }

      const assistantMessage: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: result.reply,
      };
      setMessages((current) => [...current, assistantMessage].slice(-20));
      setMoodAndLive2D(result.mood ?? "neutral");
      if (voiceOnRef.current) {
        speakText(result.reply, handleSpeaking);
      }
    } catch {
      setError("网络连接不太稳定，稍后再和八千代说话吧");
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [handleSpeaking, input, setMoodAndLive2D]);

  const clearHistory = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    live2dRef.current?.setSpeaking(false);
    const greeting: ChatMessage = {
      id: `greeting-${Date.now()}`,
      role: "assistant",
      content: GREETING,
    };
    setMessages([greeting]);
    messagesRef.current = [greeting];
    setError(null);
    setMoodAndLive2D("neutral");
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([greeting]));
    } catch {
      // ignore
    }
  };

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    // The handle reads through the canvas event below; kept local to avoid rerenders.
    live2dRef.current?.focus(x, y);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="fixed bottom-[86px] right-4 z-[60] flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-white/70 bg-paper-50 shadow-[0_12px_40px_rgba(14,42,56,0.22)] transition hover:scale-105 sm:bottom-6 sm:right-6"
        aria-label={open ? "关闭八千代助手" : "和八千代聊聊"}
        aria-expanded={open}
      >
        <Image
          src="/live2d/yachiyo/avatar.png"
          alt=""
          width={56}
          height={56}
          className="h-full w-full object-cover"
          priority={false}
        />
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-crimson-600 px-1 text-[9px] font-semibold text-paper-50">
          AI
        </span>
      </button>

      {open && (
        <section
          ref={panelRef}
          aria-label="月见八千代 AI 助手"
          className="fixed bottom-[86px] left-3 right-3 z-[70] flex max-h-[calc(100dvh-104px)] flex-col overflow-hidden rounded-xl border border-ink-900/10 bg-paper-50 shadow-[0_24px_80px_rgba(14,42,56,0.24)] sm:bottom-24 sm:left-auto sm:right-6 sm:w-[390px]"
        >
          <div className="flex items-center justify-between border-b border-ink-900/8 bg-gradient-to-r from-[#eef6f8] via-paper-50 to-[#f7f0e8] px-4 py-3">
            <div>
              <p className="font-serif text-base font-semibold text-ink-900">月见八千代</p>
              <p className="mt-0.5 text-[10px] tracking-wide text-ink-700/55">
                「月读」的看板娘 · {MOOD_LABELS[mood]}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setVoiceOn((value) => !value)}
                className={`rounded-full border px-2.5 py-1 text-[10px] transition ${
                  voiceOn
                    ? "border-crimson-600/30 bg-crimson-600/10 text-crimson-700"
                    : "border-ink-900/10 text-ink-700/55 hover:text-ink-900"
                }`}
                aria-pressed={voiceOn}
              >
                {voiceOn ? "语音开" : "语音关"}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-lg leading-none text-ink-700/45 transition hover:bg-ink-900/5 hover:text-ink-900"
                aria-label="关闭助手"
              >
                ×
              </button>
            </div>
          </div>

          <div className="relative h-[238px] shrink-0 overflow-hidden bg-[radial-gradient(circle_at_50%_18%,rgba(158,204,218,0.35),transparent_55%),linear-gradient(180deg,#f4fafb_0%,#f7f2e9_100%)] sm:h-[270px]">
            <canvas
              ref={canvasRef}
              className="h-full w-full touch-none"
              aria-label="八千代 Live2D 形象"
              onPointerMove={onPointerMove}
              onPointerLeave={() => {
                live2dRef.current?.focus(0, 0);
              }}
            />
            {modelState !== "ready" && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 bg-paper-50/55">
                {modelState === "error" ? (
                  <>
                    <Image
                      src="/live2d/yachiyo/avatar.png"
                      alt="月见八千代"
                      width={148}
                      height={148}
                      className="h-36 w-36 rounded-full object-cover shadow-lg"
                    />
                    <p className="text-[10px] text-ink-700/55">Live2D 暂时没有加载成功，但还能聊天</p>
                  </>
                ) : (
                  <>
                    <span className="h-8 w-8 animate-spin rounded-full border-2 border-crimson-600/20 border-t-crimson-600" />
                    <p className="text-[10px] text-ink-700/55">八千代正在整理衣角…</p>
                  </>
                )}
              </div>
            )}
          </div>

          <div
            ref={listRef}
            className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4"
            aria-live="polite"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] whitespace-pre-wrap break-words rounded-xl px-3.5 py-2.5 text-[12px] leading-6 ${
                    message.role === "user"
                      ? "rounded-br-sm bg-ink-900 text-paper-50"
                      : "rounded-bl-sm border border-ink-900/8 bg-white/70 text-ink-800"
                  }`}
                >
                  {message.role === "assistant"
                    ? message.content.replace(/\*\*/g, "")
                    : message.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-xl rounded-bl-sm border border-ink-900/8 bg-white/70 px-4 py-3 text-[12px] text-ink-700/55">
                  <span className="inline-flex gap-1">
                    <span className="animate-pulse">·</span>
                    <span className="animate-pulse [animation-delay:120ms]">·</span>
                    <span className="animate-pulse [animation-delay:240ms]">·</span>
                  </span>
                </div>
              </div>
            )}
            {error && (
              <p className="rounded-lg border border-crimson-600/15 bg-crimson-600/5 px-3 py-2 text-[11px] leading-5 text-crimson-700">
                {error}
              </p>
            )}
          </div>

          <div className="border-t border-ink-900/8 bg-paper-50 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void send();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                maxLength={1000}
                placeholder="和八千代说点什么…"
                className="min-w-0 flex-1 rounded-full border border-ink-900/10 bg-white/75 px-4 py-2.5 text-[12px] text-ink-900 outline-none transition placeholder:text-ink-700/35 focus:border-crimson-600/35"
                aria-label="输入消息"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-crimson-600 text-sm text-paper-50 transition hover:bg-crimson-700 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="发送"
              >
                ↑
              </button>
            </form>
            <div className="mt-2 flex items-center justify-between px-1 text-[9px] text-ink-700/40">
              <span>对话仅保存在本机浏览器</span>
              <button type="button" onClick={clearHistory} className="hover:text-crimson-700">
                清空对话
              </button>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
