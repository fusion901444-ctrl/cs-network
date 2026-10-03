"use client";

import Link from "next/link";
import { Fragment, useEffect, useState } from "react";
import { AiBadge, AiOutput, useAi } from "@/components/AiPanel";
import { useApp } from "@/components/AppProvider";
import { WorkCard } from "@/components/ui";
import { TYPES } from "@/lib/constants";
import { supabase } from "@/lib/supabase";
import type { Agency, Work } from "@/lib/types";
import { byDateDesc, lastInspection } from "@/lib/utils";

type Field = Exclude<keyof Agency, "id" | "name" | "created_at">;
const FIELDS: [Field, string][] = [
  ["dept", "담당부서"],
  ["contact_name", "담당자"],
  ["phone", "전화번호"],
  ["address", "주소"],
  ["contract_amount", "계약금액(월)"],
  ["inspection_cycle", "점검주기"],
  ["memo", "특이사항"],
];

export default function AgencyDetail({ id }: { id: string }) {
  const { agency, toast } = useApp();
  const a = agency(id);
  const [works, setWorks] = useState<Work[] | null>(null);
  const [editing, setEditing] = useState(false);
  const ai = useAi();

  useEffect(() => {
    supabase.from("works").select("*").eq("agency_id", id).then(({ data, error }) => {
      if (error) toast("작업 이력을 불러오지 못했습니다: " + error.message);
      setWorks(((data ?? []) as Work[]).sort(byDateDesc));
    });
  }, [id, toast]);

  if (!a) return <p className="muted center">기관을 찾을 수 없습니다</p>;

  const ws = works ?? [];
  const y = String(new Date().getFullYear());
  const yr = ws.filter((w) => w.scheduled_date.startsWith(y));
  const last = lastInspection(ws);
  const typeCounts = TYPES.map((t) => [t, yr.filter((w) => w.type === t).length] as const).filter(([, n]) => n);

  const show = (k: Field) => {
    const v = a[k];
    if (v == null || v === "") return "-";
    if (k === "phone") return <a href={`tel:${v}`} style={{ color: "#1e3a8a" }}>{v}</a>;
    if (k === "contract_amount") return Number(v).toLocaleString() + "원";
    return v;
  };

  return (
    <>
      <h2>{a.name}</h2>
      <div className="card">
        {editing ? (
          <AgencyForm a={a} onDone={() => setEditing(false)} />
        ) : (
          <>
            <dl>{FIELDS.map(([k, l]) => <Fragment key={k}><dt>{l}</dt><dd>{show(k)}</dd></Fragment>)}</dl>
            <button className="btn ghost" onClick={() => setEditing(true)}>정보 수정</button>
          </>
        )}
      </div>
      <Link className="btn" href={`/new?agency=${id}`}>+ 이 기관 작업 등록</Link>
      <Link className="btn ghost" href={`/report/${id}`}>점검 보고서</Link>
      <div className="card" style={{ marginTop: 12 }}>
        <b>{y}년 작업 {yr.length}건</b> <span className="muted">· 최근 점검 {last ?? "없음"}</span>
        <div className="chips" style={{ marginTop: 8 }}>
          {typeCounts.length
            ? typeCounts.map(([t, n]) => <span key={t} className={`tag ty-${TYPES.indexOf(t)}`}>{t} {n}</span>)
            : <span className="muted">기록 없음</span>}
        </div>
      </div>
      <div className="card ai-card">
        <div className="row"><b><AiBadge /> AI 점검 분석</b></div>
        <p className="muted" style={{ margin: "6px 0 0" }}>이 기관의 점검·작업 이력에서 반복 이상, 주의 장비, 다음 점검 확인 항목을 정리합니다.</p>
        <AiOutput text={ai.text} loading={ai.loading} />
        <button className="btn ai" onClick={() => ai.run({ mode: "agency", agencyId: id })} disabled={ai.loading}>
          {ai.loading ? "분석 중…" : ai.text ? "다시 분석" : "AI로 이력 분석"}
        </button>
      </div>
      <h2 style={{ marginTop: 16 }}>작업 이력</h2>
      {!works ? <p className="muted">불러오는 중…</p>
        : ws.length ? ws.map((w) => <WorkCard key={w.id} w={w} showAgency={false} />)
        : <p className="muted">아직 이력이 없습니다</p>}
    </>
  );
}

function AgencyForm({ a, onDone }: { a: Agency; onDone: () => void }) {
  const { reloadAgencies, toast } = useApp();
  const [name, setName] = useState(a.name);
  const [f, setF] = useState<Record<Field, string>>(
    () => Object.fromEntries(FIELDS.map(([k]) => [k, a[k] == null ? "" : String(a[k])])) as Record<Field, string>
  );
  const set = (k: Field, v: string) => setF((prev) => ({ ...prev, [k]: v }));

  async function save() {
    if (!name.trim()) return toast("기관명을 입력하세요");
    const digits = f.contract_amount.replace(/[^0-9]/g, "");
    const patch = {
      name: name.trim(),
      ...Object.fromEntries(FIELDS.map(([k]) => [k, f[k].trim() || null])),
      contract_amount: digits ? parseInt(digits, 10) : null,
    };
    const { error } = await supabase.from("agencies").update(patch).eq("id", a.id);
    if (error) return toast("저장 실패: " + error.message);
    await reloadAgencies();
    toast("저장했습니다");
    onDone();
  }

  return (
    <>
      <label className="l" style={{ marginTop: 0 }}>기관명</label>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      {FIELDS.map(([k, l]) => (
        <div key={k}>
          <label className="l">{l}</label>
          {k === "memo" ? (
            <>
              <textarea value={f.memo} onChange={(e) => set("memo", e.target.value)} placeholder="전산실 위치, 랙 구성 등" />
              <div className="warn">※ IP 주소, 계정·비밀번호, 망 구성도는 입력하지 마세요</div>
            </>
          ) : (
            <input
              value={f[k]}
              onChange={(e) => set(k, e.target.value)}
              type={k === "phone" ? "tel" : "text"}
              inputMode={k === "contract_amount" ? "numeric" : undefined}
              placeholder={k === "contract_amount" ? "예: 1500000" : k === "inspection_cycle" ? "예: 월간 / 분기" : undefined}
            />
          )}
        </div>
      ))}
      <button className="btn" onClick={save}>저장</button>
      <button className="btn gray" onClick={onDone}>취소</button>
    </>
  );
}
