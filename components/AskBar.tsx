"use client";

import { useState } from "react";

const EXAMPLES = [
  "Which city grew fastest year-over-year in 2024?",
  "Top 5 units by revenue all-time",
  "Total revenue in 2025 vs 2024",
  "Average monthly revenue per unit in Atlanta",
];

// Minimal markdown: **bold**, `- ` bullets, and line breaks.
function renderAnswer(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    const bullet = /^\s*[-*]\s+/.test(line);
    const content = line.replace(/^\s*[-*]\s+/, "");
    const parts = content.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
      p.startsWith("**") && p.endsWith("**") ? (
        <strong key={j} className="font-semibold text-slate-900">
          {p.slice(2, -2)}
        </strong>
      ) : (
        <span key={j}>{p}</span>
      )
    );
    if (bullet) {
      return (
        <div key={i} className="flex gap-2 pl-1">
          <span className="text-accent">•</span>
          <span>{parts}</span>
        </div>
      );
    }
    if (line.trim() === "") return <div key={i} className="h-2" />;
    return <div key={i}>{parts}</div>;
  });
}

export default function AskBar({ includeSold = true }: { includeSold?: boolean }) {
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function ask(question: string) {
    const text = question.trim();
    if (!text || loading) return;
    setLoading(true);
    setError(null);
    setAnswer(null);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text, includeSold }),
      });
      const data = await res.json();
      if (!res.ok) setError(data?.error || "Something went wrong.");
      else setAnswer(data.answer);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(q);
        }}
        className="flex items-center gap-2"
      >
        <span className="pl-1 text-accent" aria-hidden>
          ✦
        </span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ask anything about your portfolio — e.g. “Which unit had the best YoY growth in 2024?”"
          className="min-w-0 flex-1 bg-transparent px-1 py-1.5 text-sm text-slate-800 placeholder:text-ink-600 outline-none"
        />
        <button
          type="submit"
          disabled={loading || !q.trim()}
          className="shrink-0 rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Thinking…" : "Ask"}
        </button>
      </form>

      {!answer && !error && !loading && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => {
                setQ(ex);
                ask(ex);
              }}
              className="rounded-full border border-ink-700 bg-ink-800/60 px-2.5 py-1 text-[11px] text-slate-500 transition hover:border-ink-600 hover:text-slate-800"
            >
              {ex}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="mt-3 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {error}
        </div>
      )}

      {(loading || answer) && (
        <div className="mt-3 rounded-lg border border-ink-700 bg-ink-950 px-4 py-3 text-sm leading-relaxed text-slate-700">
          {loading ? (
            <span className="text-ink-600">Analyzing your data…</span>
          ) : (
            <div className="space-y-0.5">{renderAnswer(answer!)}</div>
          )}
        </div>
      )}
    </div>
  );
}
