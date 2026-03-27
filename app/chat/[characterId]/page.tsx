"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Languages, Sparkles, Volume2 } from "lucide-react";

import { getCharacterById } from "@/lib/characters";
import { getTemporaryVocabulary } from "@/lib/temporary-vocabulary";

type ChatPageProps = {
  params: Promise<{
    characterId: string;
  }>;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type ConversationStatus = "connecting" | "listening" | "thinking" | "speaking" | "error";

type BrowserSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: null | (() => void);
  onend: null | (() => void);
  onerror: null | ((event: { error?: string }) => void);
  onresult: null | ((event: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void);
  start: () => void;
  stop: () => void;
  abort: () => void;
};

declare global {
  interface Window {
    SpeechRecognition?: new () => BrowserSpeechRecognition;
    webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
  }
}

function speakText(text: string, onEnd?: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    onEnd?.();
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.95;
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();
  window.speechSynthesis.speak(utterance);
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getScenePalette(characterId: string, role: string) {
  const map: Record<string, { start: string; middle: string; end: string; accent: string; scene: string }> = {
    "london-restaurant-server": {
      start: "#091a17",
      middle: "#0f3d35",
      end: "#2dd4bf",
      accent: "#fef3c7",
      scene: "Soft evening restaurant",
    },
    "hotel-receptionist": {
      start: "#08131a",
      middle: "#164e63",
      end: "#34d399",
      accent: "#e0f2fe",
      scene: "Quiet hotel lobby",
    },
    "triage-nurse": {
      start: "#07130d",
      middle: "#14532d",
      end: "#6ee7b7",
      accent: "#dcfce7",
      scene: "Calm clinic room",
    },
  };

  return map[characterId] ?? {
    start: "#0f172a",
    middle: "#0f3d35",
    end: "#34d399",
    accent: "#ecfdf5",
    scene: role,
  };
}

function getBackgroundArt(character: NonNullable<ReturnType<typeof getCharacterById>>) {
  const palette = getScenePalette(character.id, character.role);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 2200">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${palette.start}"/>
          <stop offset="52%" stop-color="${palette.middle}"/>
          <stop offset="100%" stop-color="${palette.end}"/>
        </linearGradient>
        <radialGradient id="glowA" cx="50%" cy="18%" r="45%">
          <stop offset="0%" stop-color="${palette.accent}" stop-opacity="0.9"/>
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="glowB" cx="50%" cy="76%" r="42%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.16"/>
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="1200" height="2200" fill="url(#bg)"/>
      <rect width="1200" height="2200" fill="url(#glowA)" opacity="0.48"/>
      <rect width="1200" height="2200" fill="url(#glowB)" opacity="0.36"/>
      <ellipse cx="600" cy="420" rx="520" ry="260" fill="#ffffff" fill-opacity="0.08"/>
      <ellipse cx="600" cy="1680" rx="640" ry="420" fill="#020617" fill-opacity="0.42"/>
      <rect x="160" y="280" width="880" height="430" rx="42" fill="#ffffff" fill-opacity="0.06"/>
      <rect x="220" y="360" width="220" height="18" rx="9" fill="#ffffff" fill-opacity="0.2"/>
      <rect x="220" y="410" width="320" height="14" rx="7" fill="#ffffff" fill-opacity="0.12"/>
      <rect x="220" y="450" width="280" height="14" rx="7" fill="#ffffff" fill-opacity="0.12"/>
      <circle cx="910" cy="450" r="120" fill="#ffffff" fill-opacity="0.08"/>
      <rect x="120" y="1180" width="960" height="620" rx="70" fill="#000000" fill-opacity="0.16"/>
      <rect x="180" y="1260" width="840" height="220" rx="34" fill="#ffffff" fill-opacity="0.08"/>
      <rect x="220" y="1328" width="420" height="28" rx="14" fill="#ffffff" fill-opacity="0.82"/>
      <rect x="220" y="1390" width="520" height="18" rx="9" fill="#ffffff" fill-opacity="0.22"/>
      <rect x="220" y="1434" width="440" height="18" rx="9" fill="#ffffff" fill-opacity="0.18"/>
      <circle cx="600" cy="1880" r="132" fill="#ffffff" fill-opacity="0.08"/>
      <circle cx="600" cy="1880" r="92" fill="#ffffff" fill-opacity="0.12"/>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function getPortraitArt(character: NonNullable<ReturnType<typeof getCharacterById>>) {
  const palette = getScenePalette(character.id, character.role);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 900">
      <defs>
        <linearGradient id="portraitBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${palette.middle}"/>
          <stop offset="100%" stop-color="${palette.end}"/>
        </linearGradient>
        <radialGradient id="light" cx="50%" cy="22%" r="46%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/>
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="900" height="900" fill="url(#portraitBg)"/>
      <rect width="900" height="900" fill="url(#light)" opacity="0.42"/>
      <circle cx="450" cy="286" r="116" fill="#f8fafc" fill-opacity="0.96"/>
      <path d="M216 706c54-150 156-230 234-230s180 80 234 230" fill="#f8fafc" fill-opacity="0.95"/>
      <path d="M322 252c24-94 232-94 256 0-10-142-246-142-256 0Z" fill="#052e2b" fill-opacity="0.88"/>
      <circle cx="396" cy="292" r="8" fill="#0f172a" fill-opacity="0.34"/>
      <circle cx="504" cy="292" r="8" fill="#0f172a" fill-opacity="0.34"/>
      <path d="M410 350c21 18 59 18 80 0" stroke="#0f172a" stroke-opacity="0.24" stroke-width="10" stroke-linecap="round" fill="none"/>
      <text x="450" y="806" text-anchor="middle" fill="#ffffff" fill-opacity="0.95" font-size="92">${character.emoji}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export default function ChatPage({ params }: ChatPageProps) {
  const [characterId, setCharacterId] = useState("");
  const [warmupWords, setWarmupWords] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ConversationStatus>("connecting");
  const [error, setError] = useState<string | null>(null);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [sessionSeconds, setSessionSeconds] = useState(0);

  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const recognitionActiveRef = useRef(false);
  const recognitionStartLockRef = useRef(false);
  const shouldResumeRecognitionRef = useRef(false);
  const hasRequestedAudioRef = useRef(false);

  useEffect(() => {
    params.then((value) => setCharacterId(value.characterId));
  }, [params]);

  const character = useMemo(() => {
    if (!characterId) {
      return undefined;
    }

    return getCharacterById(characterId);
  }, [characterId]);

  const backgroundArt = useMemo(() => {
    if (!character) {
      return "";
    }

    return getBackgroundArt(character);
  }, [character]);

  const portraitArt = useMemo(() => {
    if (!character) {
      return "";
    }

    return getPortraitArt(character);
  }, [character]);

  useEffect(() => {
    if (!character) {
      return;
    }

    const stored = getTemporaryVocabulary(character.id);
    const defaults = character.preparationVocabulary.map((item) => item.term);
    setWarmupWords(stored.length > 0 ? stored : defaults);
  }, [character]);

  const openingLine = useMemo(() => {
    if (!character) {
      return "";
    }

    const firstWord = warmupWords[0];

    switch (character.id) {
      case "london-restaurant-server":
        return `Hi there! Welcome in. Are you ready to order, or would you like a ${firstWord ?? "recommendation"} first?`;
      case "hotel-receptionist":
        return "Good evening. May I have your name, please, so I can find your reservation?";
      case "triage-nurse":
        return "Hi, tell me what brought you in today, and I’ll help you from there.";
      default:
        return `Hi! I’m ${character.name}. Start speaking whenever you’re ready, and I’ll answer naturally.`;
    }
  }, [character, warmupWords]);

  const followUpLine = useMemo(() => {
    if (!character) {
      return "";
    }

    if (warmupWords.length === 0) {
      return "Take your time. I’m listening.";
    }

    return `If it feels natural, try using: ${warmupWords.slice(0, 3).join(" · ")}.`;
  }, [character, warmupWords]);

  useEffect(() => {
    if (!character || !openingLine || !followUpLine) {
      return;
    }

    setMessages([
      { id: createId("assistant"), role: "assistant", content: openingLine },
      { id: createId("assistant"), role: "assistant", content: followUpLine },
    ]);
    setError(null);
    setSessionSeconds(0);
  }, [character, openingLine, followUpLine]);

  useEffect(() => {
    if (!character) {
      return;
    }

    const timer = window.setInterval(() => {
      setSessionSeconds((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [character]);

  const formattedSessionTime = useMemo(() => {
    const minutes = Math.floor(sessionSeconds / 60).toString().padStart(2, "0");
    const seconds = (sessionSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }, [sessionSeconds]);

  const latestAssistantMessage = useMemo(
    () => [...messages].reverse().find((message) => message.role === "assistant")?.content ?? "",
    [messages]
  );

  const latestUserMessage = useMemo(
    () => [...messages].reverse().find((message) => message.role === "user")?.content ?? "",
    [messages]
  );

  const statusLabel = useMemo(() => {
    if (status === "connecting") return "Connecting";
    if (status === "listening") return "Listening";
    if (status === "thinking") return "Reflecting";
    if (status === "speaking") return "Responding";
    return "Paused";
  }, [status]);

  const startRecognition = useCallback(() => {
    const recognition = recognitionRef.current;

    if (!recognition || recognitionActiveRef.current || recognitionStartLockRef.current) {
      return;
    }

    recognitionStartLockRef.current = true;

    try {
      recognition.start();
    } catch {
      recognitionStartLockRef.current = false;
    }

    window.setTimeout(() => {
      recognitionStartLockRef.current = false;
    }, 400);
  }, []);

  const stopRecognition = useCallback(() => {
    const recognition = recognitionRef.current;

    if (!recognition) {
      return;
    }

    shouldResumeRecognitionRef.current = false;

    if (recognitionActiveRef.current) {
      recognition.stop();
    }
  }, []);

  const submitUtterance = useCallback(
    async (spokenText: string) => {
      const trimmed = spokenText.trim();

      if (!trimmed || !character) {
        return;
      }

      shouldResumeRecognitionRef.current = false;
      setInterimTranscript("");
      stopRecognition();

      const userMessage: ChatMessage = {
        id: createId("user"),
        role: "user",
        content: trimmed,
      };

      setMessages((current) => [...current, userMessage]);
      setStatus("thinking");
      setError(null);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            characterId: character.id,
            temporaryVocabulary: warmupWords,
            messages: [...messages, userMessage].map(({ role, content }) => ({ role, content })),
          }),
        });

        const data = (await response.json()) as {
          message?: string;
          error?: string;
        };

        if (!response.ok || !data.message) {
          throw new Error(data.error || "Something went wrong.");
        }

        const assistantMessage = data.message;

        setMessages((current) => [
          ...current,
          { id: createId("assistant"), role: "assistant", content: assistantMessage },
        ]);

        setStatus("speaking");
        speakText(assistantMessage, () => {
          setStatus("listening");
          shouldResumeRecognitionRef.current = true;
          startRecognition();
        });
      } catch (submissionError) {
        setStatus("error");
        setError(submissionError instanceof Error ? submissionError.message : "Failed to continue the conversation.");
      }
    },
    [character, messages, startRecognition, stopRecognition, warmupWords]
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!Recognition) {
      setStatus("error");
      setError("This browser does not support hands-free speech recognition.");
      return;
    }

    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      recognitionActiveRef.current = true;
      setStatus("listening");
      setError(null);
    };

    recognition.onresult = (event) => {
      let interim = "";
      const finalized: string[] = [];

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result[0]?.transcript?.trim();

        if (!transcript) {
          continue;
        }

        if (result.isFinal) {
          finalized.push(transcript);
        } else {
          interim = transcript;
        }
      }

      setInterimTranscript(interim);

      const joinedFinal = finalized.join(" ").trim();

      if (joinedFinal) {
        void submitUtterance(joinedFinal);
      }
    };

    recognition.onerror = (event) => {
      recognitionActiveRef.current = false;

      if (event.error === "no-speech") {
        setStatus("listening");
        return;
      }

      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        shouldResumeRecognitionRef.current = false;
        setStatus("error");
        setError("Microphone permission is blocked. Please allow mic access and reopen the page.");
        return;
      }

      setStatus("error");
      setError("Voice connection was interrupted.");
    };

    recognition.onend = () => {
      recognitionActiveRef.current = false;
      setInterimTranscript("");

      if (shouldResumeRecognitionRef.current) {
        window.setTimeout(() => {
          startRecognition();
        }, 250);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      shouldResumeRecognitionRef.current = false;
      recognitionActiveRef.current = false;
      window.speechSynthesis?.cancel();
      recognition.abort();
      recognitionRef.current = null;
    };
  }, [startRecognition, submitUtterance]);

  useEffect(() => {
    if (!character || hasRequestedAudioRef.current) {
      return;
    }

    hasRequestedAudioRef.current = true;
    shouldResumeRecognitionRef.current = true;

    async function bootConversation() {
      try {
        if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((track) => track.stop());
        }

        startRecognition();
      } catch {
        shouldResumeRecognitionRef.current = false;
        setStatus("error");
        setError("Unable to access the microphone. Please allow mic access to continue.");
      }
    }

    void bootConversation();
  }, [character, startRecognition]);

  if (!characterId) {
    return null;
  }

  if (!character) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900">
        <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200/70">
          <p className="text-lg font-semibold">没有找到这个聊天场景</p>
          <p className="mt-2 text-sm text-slate-500">请返回首页重新选择角色。</p>
          <Link href="/" className="mt-5 inline-flex min-h-11 items-center rounded-full bg-emerald-600 px-5 text-sm font-medium text-white">
            返回首页
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <img src={backgroundArt} alt={`${character.name} scene`} className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.14),rgba(2,6,23,0.26)_22%,rgba(2,6,23,0.46)_55%,rgba(2,6,23,0.84)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.16),_transparent_24%),radial-gradient(circle_at_bottom,_rgba(16,185,129,0.12),_transparent_28%)]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col safe-pt safe-pb">
        <header className="flex items-center justify-between px-6 py-4 backdrop-blur-3xl">
          <div className="flex items-center gap-4">
            <Link href={`/prepare/${character.id}`} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/20">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex flex-col">
              <h1 className="text-lg font-semibold leading-tight text-white">AI Conversation</h1>
              <span className="text-[10px] font-bold uppercase tracking-[0.26em] text-white/60">Session {formattedSessionTime}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/14 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-white/80">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            {statusLabel}
          </div>
        </header>

        <section className="relative flex flex-1 flex-col items-center justify-center px-6 pb-48 pt-8 text-center">
          <div className="relative">
            <div className="absolute inset-0 scale-110 rounded-full border border-white/10" />
            <div className="absolute inset-0 scale-125 rounded-full border border-white/6" />
            <div className="relative h-64 w-64 overflow-hidden rounded-full border-4 border-white/20 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.52)]">
              <img src={portraitArt} alt={`${character.name} portrait`} className="h-full w-full object-cover" />
            </div>
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-white/20 bg-white/10 px-8 py-2.5 shadow-xl backdrop-blur-3xl">
              <span className="text-xs font-bold uppercase tracking-[0.22em] text-white">{character.name}</span>
            </div>
          </div>

          <div className="mt-14 text-center">
            <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-white/52">Scenario: {character.role}</p>
          </div>

          <div className="mt-8 w-full max-w-2xl rounded-[28px] border border-white/10 bg-black/20 p-8 backdrop-blur-2xl">
            <h2 className="text-[30px] leading-[1.3] tracking-tight text-white" style={{ fontFamily: "var(--font-display)" }}>
              “{latestAssistantMessage || openingLine}”
            </h2>
            <p className="mt-4 text-lg font-medium italic text-white/62">
              {interimTranscript || latestUserMessage || "Start speaking in English. The conversation will flow naturally here."}
            </p>
          </div>
        </section>

        {error ? (
          <div className="relative z-20 mx-6 mb-4 rounded-3xl border border-rose-200/15 bg-rose-500/10 px-4 py-3 text-sm text-rose-100 backdrop-blur-xl">
            {error}
          </div>
        ) : null}

        <div className="pointer-events-none fixed bottom-0 left-0 z-40 w-full px-8 pb-12">
          <div className="mx-auto flex max-w-md items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/80 backdrop-blur-xl">
              <Volume2 className="h-5 w-5" />
            </div>

            <button
              type="button"
              onClick={() => {
                if (status === "error") {
                  shouldResumeRecognitionRef.current = true;
                  setStatus("connecting");
                  setError(null);
                  startRecognition();
                }
              }}
              className="pointer-events-auto relative flex h-28 w-28 items-center justify-center"
              aria-label="Conversation core"
            >
              <div className={`conversation-orb-halo absolute inset-4 rounded-full ${status === "speaking" ? "opacity-100" : "opacity-70"}`} />
              <div className={`conversation-orb-halo absolute inset-0 rounded-full ${status === "thinking" ? "opacity-90" : "opacity-45"}`} />
              <div className={`conversation-orb relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-white/30 bg-[linear-gradient(135deg,rgba(255,255,255,0.34),rgba(16,185,129,0.82)_38%,rgba(5,150,105,0.94)_100%)] backdrop-blur-sm ${status === "speaking" ? "conversation-orb-speaking" : ""}`}>
                <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(255,255,255,0.35),transparent_55%)]" />
                <div className="relative z-10 h-8 w-8 rounded-full border border-white/30 bg-white/14" />
              </div>
            </button>

            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/80 backdrop-blur-xl">
              <Languages className="h-5 w-5" />
            </div>
          </div>

          <div className="mx-auto mt-4 flex max-w-md items-center justify-between rounded-full border border-white/10 bg-white/8 px-4 py-3 text-[11px] uppercase tracking-[0.18em] text-white/72 backdrop-blur-xl">
            <span>{statusLabel}</span>
            <span className="truncate px-3">{warmupWords.slice(0, 2).join(" · ")}</span>
            <span className="inline-flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Deep mode</span>
          </div>
        </div>
      </div>
    </main>
  );
}
