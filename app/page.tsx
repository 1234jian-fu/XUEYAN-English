"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, Menu, Sparkles } from "lucide-react";

import { characters, scenarioCategories, type Character } from "@/lib/characters";

type CategoryFilter = (typeof scenarioCategories)[number]["id"];

function CharacterCard({ character }: { character: Character }) {
  return (
    <Link
      href={`/prepare/${character.id}`}
      className="group overflow-hidden rounded-[28px] bg-white/90 p-5 shadow-[0_20px_40px_rgba(5,150,105,0.08)] ring-1 ring-emerald-100/80 backdrop-blur transition duration-200 active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-20 w-16 shrink-0 items-center justify-center rounded-[20px] bg-gradient-to-br from-emerald-50 to-slate-100 text-3xl shadow-sm ring-1 ring-emerald-100/80">
            <span aria-hidden="true">{character.emoji}</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-emerald-700/80">
              <span>{character.flag}</span>
              <span>{character.categoryLabel}</span>
            </div>
            <h2
              className="mt-2 text-[30px] leading-none tracking-tight text-slate-900"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {character.name}
            </h2>
            <p className="mt-2 text-sm text-slate-500">{character.role}</p>
          </div>
        </div>

        <span className="flex h-11 min-w-11 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>

      <p className="mt-5 text-sm leading-6 text-slate-600">{character.tagline}</p>

      <div className="mt-5 flex flex-wrap gap-2">
        {character.preparationVocabulary.map((item) => (
          <span
            key={item.term}
            className="rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700"
          >
            {item.term}
          </span>
        ))}
      </div>
    </Link>
  );
}

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");

  const filteredCharacters = useMemo(() => {
    if (activeCategory === "all") {
      return characters;
    }

    return characters.filter((character) => character.category === activeCategory);
  }, [activeCategory]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 safe-pt safe-pb">
        <header className="liquid-glass rounded-[32px] px-5 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/70 text-slate-700 ring-1 ring-emerald-100"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-emerald-700/70">Digital Atelier</p>
                <h1
                  className="text-[30px] italic tracking-tight text-slate-900"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  XUEYAN
                </h1>
              </div>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Choose your scenario</p>
            <h2
              className="max-w-[240px] text-[42px] leading-none italic tracking-tight text-emerald-700"
              style={{ fontFamily: "var(--font-display)" }}
            >
              像进入作品集一样进入一场口语练习。
            </h2>
            <p className="max-w-[280px] text-sm leading-6 text-slate-500">
              先选角色，再做词包预热，最后进入真实对话。整个流程专门按手机单手操作优化。
            </p>
          </div>
        </header>

        <section className="mt-6">
          <div className="hide-scrollbar -mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1">
            {scenarioCategories.map((category) => {
              const isActive = activeCategory === category.id;

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveCategory(category.id)}
                  className={`flex min-h-11 snap-start items-center rounded-full px-4 text-sm font-medium whitespace-nowrap transition ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-white text-slate-600 ring-1 ring-slate-200"
                  }`}
                >
                  {category.label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-6 flex items-end justify-between px-1">
          <div>
            <p
              className="text-[28px] italic leading-none tracking-tight text-slate-900"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Your Partner
            </p>
            <p className="mt-2 text-sm text-slate-500">轻点卡片进入备战页</p>
          </div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{filteredCharacters.length} roles</p>
        </section>

        <section className="mt-4 space-y-4">
          {filteredCharacters.map((character) => (
            <CharacterCard key={character.id} character={character} />
          ))}
        </section>
      </div>
    </main>
  );
}
