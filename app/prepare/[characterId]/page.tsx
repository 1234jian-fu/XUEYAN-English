"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Plus, Volume2 } from "lucide-react";

import { getCharacterById } from "@/lib/characters";
import {
  getTemporaryVocabulary,
  setTemporaryVocabulary,
} from "@/lib/temporary-vocabulary";

type PreparePageProps = {
  params: Promise<{
    characterId: string;
  }>;
};

function speakText(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
}

export default function PreparePage({ params }: PreparePageProps) {
  const [characterId, setCharacterId] = useState<string>("");
  const [customInput, setCustomInput] = useState("");
  const [selectedVocabulary, setSelectedVocabulary] = useState<string[]>([]);

  useEffect(() => {
    params.then((value) => setCharacterId(value.characterId));
  }, [params]);

  const character = useMemo(() => {
    if (!characterId) {
      return undefined;
    }

    return getCharacterById(characterId);
  }, [characterId]);

  const defaultVocabulary = useMemo(
    () => character?.preparationVocabulary.map((item) => item.term) ?? [],
    [character]
  );

  const customVocabulary = useMemo(
    () => selectedVocabulary.filter((item) => !defaultVocabulary.includes(item)),
    [defaultVocabulary, selectedVocabulary]
  );

  useEffect(() => {
    if (!character) {
      return;
    }

    const stored = getTemporaryVocabulary(character.id);
    const initial = stored.length > 0 ? stored : defaultVocabulary;

    setSelectedVocabulary(initial);

    if (stored.length === 0) {
      setTemporaryVocabulary(character.id, initial);
    }
  }, [character, defaultVocabulary]);

  if (!characterId) {
    return null;
  }

  if (!character) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900">
        <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200/70">
          <p className="text-lg font-semibold">没有找到这个场景</p>
          <p className="mt-2 text-sm text-slate-500">请返回首页重新选择角色。</p>
          <Link
            href="/"
            className="mt-5 inline-flex min-h-11 items-center rounded-full bg-emerald-600 px-5 text-sm font-medium text-white"
          >
            返回首页
          </Link>
        </div>
      </main>
    );
  }

  const handleAddVocabulary = () => {
    const value = customInput.trim();

    if (!value) {
      return;
    }

    const next = Array.from(new Set([...selectedVocabulary, value]));
    setSelectedVocabulary(next);
    setTemporaryVocabulary(character.id, next);
    speakText(value);
    setCustomInput("");
  };

  const handleToggleVocabulary = (term: string) => {
    const exists = selectedVocabulary.includes(term);
    const next = exists
      ? selectedVocabulary.filter((item) => item !== term)
      : [...selectedVocabulary, term];

    setSelectedVocabulary(next);
    setTemporaryVocabulary(character.id, next);
    speakText(term);
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 safe-pt safe-pb">
        <header className="rounded-[32px] bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.28),_transparent_35%),linear-gradient(135deg,#059669,_#10b981)] px-5 py-6 text-white shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/"
              className="flex min-h-11 min-w-11 items-center justify-center rounded-full bg-white/15 backdrop-blur"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="inline-flex min-h-11 items-center rounded-full bg-white/15 px-3 text-xs font-medium backdrop-blur">
              XUEYAN · Preparation
            </div>
          </div>

          <div className="mt-5 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-3xl shadow-sm">
              {character.emoji}
            </div>
            <div>
              <p className="text-sm text-emerald-50/85">今日备战</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight">{character.name}</h1>
              <p className="text-sm text-emerald-50/90">{character.role}</p>
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-emerald-50/90">{character.tagline}</p>
        </header>

        <section className="mt-5 rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-slate-200/70">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-base font-semibold text-slate-900">今日词包</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                先点一下听发音，再跟读两遍。绿色表示等会聊天会重点练到。
              </p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              {selectedVocabulary.length} ready
            </span>
          </div>

          <div className="mt-4 grid gap-3">
            {character.preparationVocabulary.map((item) => {
              const isSelected = selectedVocabulary.includes(item.term);

              return (
                <button
                  key={item.term}
                  type="button"
                  onClick={() => handleToggleVocabulary(item.term)}
                  className={`flex min-h-14 items-center justify-between rounded-3xl px-4 py-4 text-left shadow-sm ring-1 transition active:scale-[0.99] ${
                    isSelected
                      ? "bg-emerald-600 text-white ring-emerald-600"
                      : "bg-slate-50 text-slate-900 ring-slate-200"
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold tracking-tight">{item.term}</p>
                    <p className={`mt-1 text-xs ${isSelected ? "text-emerald-50/90" : "text-slate-500"}`}>
                      {item.note}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isSelected ? <Check className="h-4 w-4" /> : null}
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        isSelected ? "bg-white/15" : "bg-white ring-1 ring-slate-200"
                      }`}
                    >
                      <Volume2 className="h-4 w-4" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-4 rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-slate-200/70">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-base font-semibold text-slate-900">加一句你今天想练的</p>
              <p className="mt-1 text-sm text-slate-500">可以是一个词，也可以是一整句。</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
              session only
            </span>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <input
              value={customInput}
              onChange={(event) => setCustomInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleAddVocabulary();
                }
              }}
              placeholder="比如：Could I have a window seat?"
              className="min-h-12 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 placeholder:text-slate-400"
            />
            <button
              type="button"
              onClick={handleAddVocabulary}
              className="flex min-h-12 min-w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {customVocabulary.length > 0 ? (
            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                Your custom warm-up
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {customVocabulary.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleToggleVocabulary(item)}
                    className="min-h-11 rounded-full bg-emerald-50 px-4 py-2 text-sm text-emerald-700 transition active:scale-[0.99]"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            {selectedVocabulary.map((item) => (
              <span
                key={item}
                className="inline-flex min-h-11 items-center rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700"
              >
                {item}
              </span>
            ))}
          </div>
        </section>

        <div className="mt-auto pt-6">
          <Link
            href={`/chat/${character.id}`}
            className="flex min-h-14 w-full items-center justify-center rounded-3xl bg-emerald-600 px-5 text-base font-semibold text-white shadow-sm"
          >
            准备好了，开始对话
          </Link>
          <p className="mt-3 text-center text-xs text-slate-400">
            进入聊天后会把这些词放在顶部，方便你随手偷看。
          </p>
        </div>
      </div>
    </main>
  );
}
