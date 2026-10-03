"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { ChecklistView } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import type { Work } from "@/lib/types";
import { issues, todayStr, ymd } from "@/lib/utils";

// 그달에 완료된 정기점검만 보고서에 들어간다
export default function Report({ id, month }: { id: string; month?: string }) {
  const { agency, user, toast } = useApp();
  const router = useRouter();
  const a = agency(id);
  const m = month ?? todayStr().slice(0, 7);
  const [done, setDone] = useState<Work[] | null>(null);

  useEffect(() => {
    supabase.from("works").select("*").eq("agency_id", id).eq("type", "정기점검").eq("status", "완료")
      .then(({ data, error }) => {
        if (error) toast("점검 기록을 불러오지 못했습니다: " + error.message);
        setDone(((data ?? []) as Work[]).sort((x, y) => (x.completed_at ?? "").localeCompare(y.completed_at ?? "")));
      });
  }, [id, toast]);

  if (!a) return <p className="muted center">기관을 찾을 수 없습니다</p>;

  const [yy, mm] = m.split("-");
  const list = (done ?? []).filter((w) => w.completed_at && ymd(new Date(w.completed_at)).startsWith(m));
  const total = list.reduce((s, w) => s + issues(w), 0);

  return (
    <>
      <div className="noprint">
        <Link href={`/a/${id}`} className="muted">← {a.name}</Link>
        <label className="l">점검 월</label>
        <input type="month" value={m} onChange={(e) => e.target.value && router.replace(`/report/${id}?m=${e.target.value}`)} />
        <button className="btn" onClick={() => window.print()} disabled={!list.length}>인쇄 / PDF 저장</button>
        <p className="muted">인쇄 창에서 대상을 &quot;PDF로 저장&quot;으로 선택하면 PDF 파일로 저장됩니다.</p>
      </div>
      {!done ? (
        <p className="muted center">불러오는 중…</p>
      ) : !list.length ? (
        <div className="card" style={{ marginTop: 12 }}>
          <p className="muted center">{yy}년 {+mm}월에 완료된 정기점검이 없습니다</p>
        </div>
      ) : (
        <div className="report" style={{ marginTop: 12 }}>
          <h1>네트워크 정기점검 보고서</h1>
          <p className="muted" style={{ textAlign: "center", margin: "0 0 16px" }}>
            {yy}년 {+mm}월 · 작성일 {todayStr()} · CS시스템(주)
          </p>
          <table>
            <tbody>
              <tr><th style={{ width: "30%" }}>기관명</th><td>{a.name}</td></tr>
              <tr><th>담당부서 / 담당자</th><td>{a.dept || "-"} / {a.contact_name || "-"}</td></tr>
              <tr><th>점검 건수</th><td>{list.length}건</td></tr>
              <tr><th>이상 항목</th><td className={total ? "bad" : ""}>{total}건</td></tr>
            </tbody>
          </table>
          {list.map((w, i) => (
            <section key={w.id}>
              <h3>점검 {i + 1}. {ymd(new Date(w.completed_at!))} · 점검자 {user(w.completed_by)?.name ?? ""}</h3>
              <p style={{ margin: "0 0 8px", fontSize: 14 }}>대상: {w.categories.join(", ")}</p>
              <ChecklistView w={w} />
              <p style={{ fontSize: 14, marginTop: 8 }}>
                <b>점검 의견</b><br /><span className="pre">{w.result || "-"}</span>
              </p>
            </section>
          ))}
          <h3>확인</h3>
          <table className="sign">
            <tbody>
              <tr><th>점검자 (CS시스템)</th><th>확인자 ({a.name})</th></tr>
              <tr><td></td><td></td></tr>
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
