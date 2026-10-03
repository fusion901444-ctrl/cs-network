"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useApp, useMe } from "@/components/AppProvider";
import { ActionFields, type ActionValues, Chips } from "@/components/ui";
import { CATS, TYPES } from "@/lib/constants";
import { supabase } from "@/lib/supabase";
import type { Status, WorkType } from "@/lib/types";
import { makeChecklist, num, orNull, todayStr } from "@/lib/utils";

export default function NewWork({ preAgencyId }: { preAgencyId?: string }) {
  const { agencies, agency, users, reloadAgencies, toast } = useApp();
  const me = useMe();
  const router = useRouter();
  const [agencyQ, setAgencyQ] = useState(agency(preAgencyId ?? null)?.name ?? "");
  const [type, setType] = useState<WorkType | null>(null);
  const [cats, setCats] = useState<string[]>([]);
  const [content, setContent] = useState("");
  const [requester, setRequester] = useState("");
  const [basis, setBasis] = useState("");
  const [scheduledDate, setScheduledDate] = useState(todayStr());
  const [assignee, setAssignee] = useState(me.role === "staff" ? me.id : "");
  const [action, setAction] = useState<ActionValues>({ result: "", materials: "", minutes: "" });
  const [saving, setSaving] = useState(false);

  // 기관명은 고유하므로 입력값과 정확히 일치하는 기관을 선택된 기관으로 본다
  const q = agencyQ.trim();
  const selected = agencies.find((a) => a.name === q);
  const matches = q && !selected ? agencies.filter((a) => a.name.includes(q)).slice(0, 8) : [];
  const isCheck = type === "정기점검";

  const toggleCat = (c: string) =>
    setCats((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : CATS.filter((x) => prev.includes(x) || x === c)));

  async function addAgencyQuick() {
    const { error } = await supabase.from("agencies").insert({ name: q });
    if (error) return toast("기관 추가 실패: " + error.message);
    await reloadAgencies();
    toast("기관을 추가했습니다");
  }

  async function submit() {
    if (!selected) return toast("기관을 선택하세요");
    if (!type) return toast("업무 유형을 선택하세요");
    if (!cats.length) return toast("대상 장비를 선택하세요");
    if (!content.trim()) return toast("요청 / 작업 내용을 입력하세요");
    if (!scheduledDate) return toast("예정일을 입력하세요");
    const result = isCheck ? "" : action.result.trim();
    const now = new Date().toISOString();
    let status: Status = "접수";
    if (result) status = "완료";
    else if (assignee) status = assignee === me.id ? "진행" : "배정";
    const row = {
      agency_id: selected.id,
      type,
      categories: cats,
      content: content.trim(),
      requester: orNull(requester),
      basis: orNull(basis),
      scheduled_date: scheduledDate,
      status,
      assignee_id: assignee || (result ? me.id : null),
      created_by: me.id,
      checklist: isCheck ? makeChecklist(cats) : null,
      result: orNull(result),
      materials: isCheck ? null : orNull(action.materials),
      work_minutes: isCheck ? null : num(action.minutes),
      completed_at: result ? now : null,
      completed_by: result ? me.id : null,
    };
    setSaving(true);
    const { data, error } = await supabase.from("works").insert(row).select("id").single();
    setSaving(false);
    if (error) return toast("등록 실패: " + error.message);
    toast(`등록 완료 · ${status}`);
    router.push(`/w/${data.id}`);
  }

  return (
    <>
      <h2>작업 등록</h2>
      <label className="l">기관 *</label>
      <input placeholder="기관명 검색" value={agencyQ} onChange={(e) => setAgencyQ(e.target.value)} autoComplete="off" />
      {q && !selected && (
        <div className="opts">
          {matches.map((a) => (
            <button key={a.id} type="button" onClick={() => setAgencyQ(a.name)}>{a.name}</button>
          ))}
          <button type="button" style={{ color: "#1e3a8a" }} onClick={addAgencyQuick}>+ &quot;{q}&quot; 새 기관으로 추가</button>
        </div>
      )}

      <label className="l">업무 유형 *</label>
      <Chips items={TYPES.map((t) => [t, t])} value={type} onChange={(v) => setType(v as WorkType)} />

      <label className="l">대상 장비 * <span className="muted">(여러 개 선택 가능)</span></label>
      <Chips items={CATS.map((c) => [c, c])} value={cats} onChange={toggleCat} />
      {isCheck && <div className="hint">정기점검은 등록 후 상세 화면에서 선택한 장비별 점검표를 체크합니다.</div>}

      <label className="l">요청 / 작업 내용 *</label>
      <textarea value={content} onChange={(e) => setContent(e.target.value)}
        placeholder="예: 10월 정기점검 / 3층 민원실 랜 포트 4개 증설 / 협력업체 VPN 접속 허용 정책 추가" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div>
          <label className="l">요청자</label>
          <input value={requester} onChange={(e) => setRequester(e.target.value)} placeholder="예: 정보통신팀 담당자" />
        </div>
        <div>
          <label className="l">근거 (공문번호 등)</label>
          <input value={basis} onChange={(e) => setBasis(e.target.value)} placeholder="예: 공문 제2026-1003호" />
        </div>
      </div>

      <label className="l">예정일 *</label>
      <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />

      <label className="l">담당 직원</label>
      <Chips items={[["", "미지정"], ...users.map((u): [string, string] => [u.id, u.name])]} value={assignee} onChange={setAssignee} />

      {!isCheck && (
        <details className="card" style={{ marginTop: 16 }}>
          <summary><b>이미 처리했어요</b> <span className="muted">(작업 결과 입력 시 바로 완료)</span></summary>
          <ActionFields isCheck={false} v={action} set={(p) => setAction((prev) => ({ ...prev, ...p }))} />
        </details>
      )}

      <button className="btn" onClick={submit} disabled={saving}>{saving ? "등록 중…" : "등록"}</button>
    </>
  );
}
