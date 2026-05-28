interface SpeechResultItem {
  isFinal: boolean;
  0: { transcript: string };
}
interface SpeechEvent {
  results: ArrayLike<SpeechResultItem>;
}
interface SpeechErrorEvent {
  error?: string;
}
interface RecognitionInstance {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: SpeechEvent) => void) | null;
  onerror: ((e: SpeechErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
type RecognitionConstructor = new () => RecognitionInstance;

function getRecognitionCtor(): RecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isVoiceSupported(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(getRecognitionCtor()) && typeof window.speechSynthesis !== "undefined";
}

export interface Listener {
  stop: () => void;
}

export interface ListenOptions {
  onPartial?: (text: string) => void;
  onFinal: (text: string) => void;
  onError?: (err: string) => void;
  onEnd?: () => void;
  lang?: string;
}

export function listen(opts: ListenOptions): Listener {
  const Ctor = getRecognitionCtor();
  if (!Ctor) {
    opts.onError?.("unsupported");
    return { stop: () => {} };
  }
  const recog = new Ctor();
  recog.lang = opts.lang ?? "en-US";
  recog.interimResults = true;
  recog.continuous = false;
  let stopped = false;

  recog.onresult = (ev) => {
    let final = "";
    let interim = "";
    for (let i = 0; i < ev.results.length; i++) {
      const item = ev.results[i];
      if (item.isFinal) final += item[0].transcript;
      else interim += item[0].transcript;
    }
    if (interim) opts.onPartial?.(interim.trim());
    if (final) opts.onFinal(final.trim());
  };
  recog.onerror = (ev) => {
    if (!stopped) opts.onError?.(ev.error ?? "error");
  };
  recog.onend = () => {
    if (!stopped) opts.onEnd?.();
  };

  try {
    recog.start();
  } catch (e) {
    opts.onError?.(e instanceof Error ? e.message : "start_error");
  }

  return {
    stop() {
      stopped = true;
      try {
        recog.abort();
      } catch {
        // ignore
      }
    },
  };
}

export function speak(
  text: string,
  opts: { onEnd?: () => void; onStart?: () => void; lang?: string } = {},
): void {
  if (typeof window === "undefined") return;
  const synth = window.speechSynthesis;
  if (!synth || !text) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = opts.lang ?? "en-US";
  u.rate = 1.05;
  u.pitch = 1.0;
  u.onstart = () => opts.onStart?.();
  u.onend = () => opts.onEnd?.();
  synth.cancel();
  synth.speak(u);
}

export function cancelSpeech(): void {
  if (typeof window === "undefined") return;
  try {
    window.speechSynthesis?.cancel();
  } catch {
    // ignore
  }
}
