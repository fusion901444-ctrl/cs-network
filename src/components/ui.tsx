"use client";

import Link from "next/link";
import { CHECK, TYPES } from "@/lib/constants";
import type { Work } from "@/lib/types";
import { fmt, issues, todayStr } from "@/lib/utils";
import { useApp } from "./AppProvider";

export function Chips({ items, value, onChange }: {
  items: [string, string][];
  value: string | string[] | null;
  onChange: (v: string) => void;
}) {
  const isOn = (v: string) => (Array.isArray(value) ? value.includes(v) : v === value);
  return (
    <div className="chips">
      {items.map(([v, label]) => (
        <button key={v} type="button" className={`chip ${isOn(v) ? "on" : ""}`} data-v={v} onClick={() => onChange(v)}>
          {label}
        </button>
      ))}
    </div>
  );
}

export const TypeTag = ({ type }: { type: string }) => (
  <span className={`tag ty-${TYPES.indexOf(type as Work["type"])}`}>{type}</span>
);

export const CatTags = ({ cats }: { cats: string[] }) => (
  <>{cats.map((c) => <span key={c} className="cat">{c}</span>)}</>
);

export const IssueBadge = ({ w }: { w: Work }) => {
  const n = issues(w);
  return n ? <span className="badge b-issue">이상 {n}</span> : null;
};

export function WorkCard({ w, showAgency }: { w: Work; showAgency: boolean }) {
  const { user, agency } = useApp();
  const a = user(w.assignee_id);
  const late = w.status !== "완료" && w.scheduled_date < todayStr();
  return (
    <Link className="card" href={`/w/${w.id}`}>
      <div className="row">
        <div><b>{showAgency ? agency(w.agency_id)?.name || "(삭제된 기관)" : w.scheduled_date}</b> <TypeTag type={w.type} /></div>
        <div><IssueBadge w={w} /> <span className={`badge b-${w.status}`}>{w.status}</span></div>
      </div>
      <div style={{ marginTop: 6 }}><CatTags cats={w.categories} /></div>
      <div className="pre" style={{ margin: "8px 0" }}>{w.content}</div>
      <div className="row muted">
        <span>{a ? "담당 " + a.name : "담당 미지정"}</span>
        <span>
          {w.status === "완료" && w.completed_at
            ? "완료 " + fmt(w.completed_at).slice(0, 10)
            : <span style={late ? { color: "#dc2626", fontWeight: 700 } : undefined}>예정 {w.scheduled_date}</span>}
        </span>
      </div>
    </Link>
  );
}

export function ChecklistView({ w }: { w: Work }) {
  return (
    <table>
      <thead><tr><th>분류</th><th>점검 항목</th><th>결과</th></tr></thead>
      <tbody>
        {w.categories.flatMap((cat) =>
          CHECK[cat].map((item, i) => {
            const r = w.checklist?.[cat]?.[item];
            return (
              <tr key={cat + item}>
                {i === 0 && <td rowSpan={CHECK[cat].length}>{cat}</td>}
                <td>{item}</td>
                <td className={r === "이상" ? "bad" : ""}>{r || "-"}</td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}

export type ActionValues = { result: string; materials: string; minutes: string };

export function ActionFields({ isCheck, v, set }: {
  isCheck: boolean;
  v: ActionValues;
  set: (patch: Partial<ActionValues>) => void;
}) {
  return (
    <>
      <label className="l">{isCheck ? "점검 의견" : "작업 내용 / 결과"}</label>
      <textarea
        value={v.result}
        onChange={(e) => set({ result: e.target.value })}
        placeholder={isCheck ? "예: 2층 스위치 24번 포트 링크 불안정 → 케이블 교체 권고" : "예: 민원실 랜 포트 4개 증설, 링크 확인 완료"}
      />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 110px", gap: 8 }}>
        <div>
          <label className="l">사용자재</label>
          <input value={v.materials} onChange={(e) => set({ materials: e.target.value })} placeholder="예: CAT6 케이블 20m" />
        </div>
        <div>
          <label className="l">소요시간(분)</label>
          <input type="number" inputMode="numeric" min={0} value={v.minutes} onChange={(e) => set({ minutes: e.target.value })} />
        </div>
      </div>
    </>
  );
}
