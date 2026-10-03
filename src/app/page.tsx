"use client";

import { useEffect, useState } from "react";
import { useApp, useMe } from "@/components/AppProvider";
import { WorkCard } from "@/components/ui";
import { STATUS, TYPES } from "@/lib/constants";
import { supabase } from "@/lib/supabase";
import type { Work } from "@/lib/types";
import { sortWork, todayStr } from "@/lib/utils";

// 다른 화면에 다녀와도 필터가 유지되도록 모듈 단위로 보관
const saved = { q: "", tab: "전체", type: "", mine: false };

export default function WorkList() {
  const { agency, user, toast } = useApp();
  const me = useMe();
  const [works, setWorks] = useState<Work[] | null>(null);
  const [q, setQ] = useState(saved.q);
  const [tab, setTab] = useState(saved.tab);
  const [type, setType] = useState(saved.type);
  const [mine, setMine] = useState(saved.mine);
  Object.assign(saved, { q, tab, type, mine });

  useEffect(() => {
    supabase.from("works").select("*").then(({ data, error }) => {
      if (error) toast("작업 목록을 불러오지 못했습니다: " + error.message);
      setWorks((data ?? []) as Work[]);
    });
  }, [toast]);

  if (!works) return <p className="muted center">불러오는 중…</p>;

  const open = works.filter((w) => w.status !== "완료");
  const today = todayStr();
  const terms = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const base = works.filter((w) => {
    if (mine && w.assignee_id !== me.id) return false;
    if (type && w.type !== type) return false;
    if (!terms.length) return true;
    const hay = [agency(w.agency_id)?.name, w.type, w.categories.join(" "), w.content, w.requester, w.basis, w.result, user(w.assignee_id)?.name]
      .join(" ").toLowerCase();
    return terms.every((t) => hay.includes(t));
  });
  const counts: Record<string, number> = { 전체: base.length };
  STATUS.forEach((s) => (counts[s] = base.filter((w) => w.status === s).length));
  const list = (tab === "전체" ? base : base.filter((w) => w.status === tab)).sort(sortWork);

  return (
    <>
      <div className="stat">
        <div><b>{open.filter((w) => w.scheduled_date <= today).length}</b><span className="muted">오늘까지 예정</span></div>
        <div><b>{open.length}</b><span className="muted">미완료</span></div>
        <div><b>{open.filter((w) => w.assignee_id === me.id).length}</b><span className="muted">내 미완료</span></div>
      </div>
      <input style={{ marginTop: 12 }} placeholder="검색: 기관, 장비, 내용, 공문번호" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="tabs">
        {["전체", ...STATUS].map((s) => (
          <button key={s} className={`tab ${tab === s ? "on" : ""}`} onClick={() => setTab(s)}>{s} {counts[s]}</button>
        ))}
      </div>
      <div className="tabs sm" style={{ marginTop: 0 }}>
        {[["", "전체 유형"], ...TYPES.map((t) => [t, t])].map(([v, l]) => (
          <button key={v} className={`tab ${type === v ? "on" : ""}`} onClick={() => setType(v)}>{l}</button>
        ))}
      </div>
      <label className="toggle">
        <input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} /> 내 작업만 보기
      </label>
      <div style={{ marginTop: 10 }}>
        {list.length ? list.map((w) => <WorkCard key={w.id} w={w} showAgency />) : <p className="muted center">해당하는 작업이 없습니다</p>}
      </div>
    </>
  );
}
