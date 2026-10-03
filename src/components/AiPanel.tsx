"use client";

import { useRef, useState } from "react";

export type AiRequest =
  | { mode: "agency"; agencyId: string }
  | { mode: "report"; agencyId: string; month: string }
  | { mode: "ask"; question: string };

// /api/ai 를 호출하고 스트리밍 텍스트를 받는다
export function useAi() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const abort = useRef<AbortController | null>(null);

  async function run(req: AiRequest) {
    abort.current?.abort();
    const ctrl = new AbortController();
    abort.current = ctrl;
    setText("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        setText("[오류] " + (await res.text()));
        return;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        setText((t) => t + dec.decode(value, { stream: true }));
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") setText("[오류] AI 서버에 연결하지 못했습니다.");
    } finally {
      if (abort.current === ctrl) setLoading(false);
    }
  }

  return { text, setText, loading, run };
}

export function AiBadge() {
  return <span className="ai-badge">AI</span>;
}

// 결과 텍스트 상자. 생성 중에는 깜빡이는 커서를 붙인다
export function AiOutput({ text, loading }: { text: string; loading: boolean }) {
  if (!text && !loading) return null;
  return (
    <div className="ai-out pre">
      {text}
      {loading && <span className="ai-caret" />}
      {loading && !text && <span className="muted"> 기록을 분석하는 중…</span>}
    </div>
  );
}
