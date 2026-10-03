"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { supabase } from "@/lib/supabase";
import type { Work } from "@/lib/types";
import { lastInspection } from "@/lib/utils";

type WorkSummary = Pick<Work, "agency_id" | "type" | "status" | "completed_at">;

export default function AgenciesPage() {
  const { agencies, reloadAgencies, toast } = useApp();
  const [works, setWorks] = useState<WorkSummary[]>([]);
  const [newName, setNewName] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    supabase.from("works").select("agency_id,type,status,completed_at").then(({ data, error }) => {
      if (error) toast("작업 정보를 불러오지 못했습니다: " + error.message);
      setWorks(data ?? []);
    });
  }, [toast]);

  async function addAgency() {
    const name = newName.trim();
    if (!name) return toast("기관명을 입력하세요");
    if (agencies.some((a) => a.name === name)) return toast("이미 등록된 기관입니다");
    const { error } = await supabase.from("agencies").insert({ name });
    if (error) return toast("추가 실패: " + error.message);
    await reloadAgencies();
    setNewName("");
    toast("추가했습니다");
  }

  const list = agencies.filter((a) => a.name.includes(q.trim())).sort((a, b) => a.name.localeCompare(b.name, "ko"));

  return (
    <>
      <h2>기관 ({agencies.length})</h2>
      <div className="row">
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="새 기관명 입력" />
        <button className="btn" style={{ width: "auto", margin: 0, padding: "12px 16px" }} onClick={addAgency}>추가</button>
      </div>
      <input style={{ marginTop: 10 }} placeholder="기관 검색" value={q} onChange={(e) => setQ(e.target.value)} />
      <div style={{ marginTop: 10 }}>
        {list.map((a) => {
          const ws = works.filter((w) => w.agency_id === a.id);
          const open = ws.filter((w) => w.status !== "완료").length;
          const last = lastInspection(ws);
          return (
            <Link key={a.id} className="card" href={`/a/${a.id}`}>
              <div className="row"><b>{a.name}</b>{open > 0 && <span className="badge b-진행">미완료 {open}</span>}</div>
              <div className="muted" style={{ marginTop: 4 }}>
                작업 {ws.length}건 · 최근 점검 {last ?? "없음"}{a.inspection_cycle ? ` · ${a.inspection_cycle} 점검` : ""}
              </div>
            </Link>
          );
        })}
        {!list.length && <p className="muted">기관이 없습니다</p>}
      </div>
    </>
  );
}
