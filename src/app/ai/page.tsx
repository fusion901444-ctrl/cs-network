"use client";

import { useState } from "react";
import { AiBadge, AiOutput, useAi } from "@/components/AiPanel";

const EXAMPLES = [
  "최근 이상이 나온 기관과 장비를 정리해줘",
  "예정일이 지난 미완료 작업 알려줘",
  "이번 달 보안정책 변경 내역과 공문번호 정리해줘",
  "스위치 포트 관련 이상 이력이 있는 곳은?",
];

export default function AiPage() {
  const [q, setQ] = useState("");
  const [asked, setAsked] = useState("");
  const ai = useAi();

  const ask = (question: string) => {
    const v = question.trim();
    if (!v || ai.loading) return;
    setQ(v);
    setAsked(v);
    ai.run({ mode: "ask", question: v });
  };

  return (
    <>
      <h2><AiBadge /> 기술지원 AI</h2>
      <p className="muted" style={{ marginTop: 0 }}>모든 기관의 점검·작업 기록을 바탕으로 답합니다. 기록에 없는 내용은 답하지 않습니다.</p>
      <div className="card ai-card">
        <textarea
          value={q}
          onChange={(e) => setQ(e.target.value)}
          maxLength={500}
          placeholder="예: 중구청 스위치 이상 이력 알려줘"
          onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) ask(q); }}
        />
        <button className="btn ai" onClick={() => ask(q)} disabled={ai.loading || !q.trim()}>{ai.loading ? "답변 작성 중…" : "질문하기"}</button>
        <div className="chips" style={{ marginTop: 6 }}>
          {EXAMPLES.map((ex) => (
            <button key={ex} type="button" className="chip sm" onClick={() => ask(ex)} disabled={ai.loading}>{ex}</button>
          ))}
        </div>
      </div>
      {asked && (
        <div className="card">
          <div className="muted">Q. {asked}</div>
          <AiOutput text={ai.text} loading={ai.loading} />
        </div>
      )}
    </>
  );
}
