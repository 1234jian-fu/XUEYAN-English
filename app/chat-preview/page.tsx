import Link from "next/link";
import { Sparkles, Volume2 } from "lucide-react";

import { ChatComposer } from "@/components/chat-composer";

export default function ChatPreviewPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 safe-pt safe-pb">
        <header className="rounded-[32px] bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.28),_transparent_35%),linear-gradient(135deg,#059669,_#10b981)] px-5 py-6 text-white shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white/15 px-3 py-2 text-xs font-medium backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              XUEYAN · Chat Mode
            </div>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center rounded-full bg-white/15 px-3 text-xs font-medium backdrop-blur"
            >
              Back
            </Link>
          </div>

          <div className="mt-5 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-2xl shadow-sm">
              🍽️
            </div>
            <div>
              <p className="text-sm text-emerald-50/85">Live conversation</p>
              <p className="text-xl font-semibold tracking-tight text-white">Sophie</p>
              <p className="text-sm text-emerald-50/90">伦敦餐厅服务员</p>
            </div>
          </div>
        </header>

        <section className="mt-4 rounded-3xl bg-white/80 p-3 shadow-sm ring-1 ring-slate-200/70 backdrop-blur">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-left"
          >
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                Warm-up words
              </p>
              <p className="mt-1 text-sm text-slate-600">recommendation · medium · bill</p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-500 ring-1 ring-slate-200">
              <Volume2 className="h-4 w-4" />
            </span>
          </button>
        </section>

        <section className="mt-4 space-y-3 pb-40">
          <div className="flex items-end gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm shadow-sm ring-1 ring-slate-200/70">
              🍽️
            </div>
            <div className="max-w-[80%] rounded-[24px] rounded-bl-md bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200/70">
              <p className="text-sm leading-6 text-slate-700">
                Hi there! Are you ready to order, or would you like a recommendation first?
              </p>
            </div>
          </div>

          <div className="ml-auto max-w-[78%] rounded-[24px] rounded-br-md bg-emerald-600 px-4 py-3 text-white shadow-sm">
            <p className="text-sm leading-6">
              I’d like your recommendation, and I want my steak medium, please.
            </p>
          </div>
        </section>
      </div>

      <ChatComposer isRecording />
    </main>
  );
}
