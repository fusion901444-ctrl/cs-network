"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useApp, useMe } from "@/components/AppProvider";
import { ActionFields, type ActionValues, CatTags, ChecklistView, Chips, IssueBadge, TypeTag } from "@/components/ui";
import { CHECK, RESULTS } from "@/lib/constants";
import { supabase } from "@/lib/supabase";
import type { CheckResult, Checklist, Work } from "@/lib/types";
import { fmt, makeChecklist, num, orNull, unchecked, ymd } from "@/lib/utils";

export default function WorkDetail({ id }: { id: string }) {
  const { agency, user, users, toast } = useApp();
  const me = useMe();
  const [w, setW] = useState<Work | null | undefined>(undefined);

  useEffect(() => {
    supabase.from("works").select("*").eq("id", id).maybeSingle().then(({ data, error }) => {
      if (error) toast("작업을 불러오지 못했습니다: " + error.message);
      setW(data as Work | null);
    });
  }, [id, toast]);

  if (w === undefined) return <p className="muted center">불러오는 중…</p>;
  if (!w) return <p className="muted center">작업을 찾을 수 없습니다</p>;

  async function update(patch: Partial<Work>, msg: string) {
    const { data, error } = await supabase.from("works").update(patch).eq("id", id).select().single();
    if (error) {
      toast("저장 실패: " + error.message);
      return false;
    }
    setW(data as Work);
    toast(msg);
    return true;
  }

  const isCheck = w.type === "정기점검";
  const a = user(w.assignee_id);

  return (
    <>
      <div className="card">
        <div className="row">
          <Link href={`/a/${w.agency_id}`} style={{ fontWeight: 700, fontSize: 17, color: "#1e3a8a" }}>{agency(w.agency_id)?.name}</Link>
          <span className={`badge b-${w.status}`}>{w.status}</span>
        </div>
        <div style={{ marginTop: 6 }}><TypeTag type={w.type} /> <CatTags cats={w.categories} /></div>
        <p className="pre" style={{ fontSize: 16, margin: "12px 0" }}>{w.content}</p>
        <dl>
          {w.requester && <><dt>요청자</dt><dd>{w.requester}</dd></>}
          {w.basis && <><dt>근거</dt><dd>{w.basis}</dd></>}
          <dt>예정일</dt><dd>{w.scheduled_date}</dd>
          <dt>담당</dt><dd>{a ? a.name : "미지정"}</dd>
          <dt>등록</dt><dd>{fmt(w.created_at)} · {user(w.created_by)?.name ?? ""}</dd>
          {w.completed_at && <><dt>완료</dt><dd>{fmt(w.completed_at)} · {user(w.completed_by)?.name ?? ""}</dd></>}
        </dl>
      </div>

      {w.status === "완료" ? (
        <>
          {isCheck && (
            <div className="card">
              <div className="row" style={{ marginBottom: 10 }}><b>점검 결과</b><IssueBadge w={w} /></div>
              <ChecklistView w={w} />
            </div>
          )}
          <div className="card">
            <b>{isCheck ? "점검 의견" : "작업 결과"}</b>
            <dl style={{ marginTop: 10 }}>
              <dt>{isCheck ? "의견" : "내용"}</dt><dd>{w.result || "-"}</dd>
              <dt>사용자재</dt><dd>{w.materials || "-"}</dd>
              <dt>소요시간</dt><dd>{w.work_minutes != null ? w.work_minutes + "분" : "-"}</dd>
            </dl>
          </div>
          {isCheck && w.completed_at && (
            <Link className="btn ghost" href={`/report/${w.agency_id}?m=${ymd(new Date(w.completed_at)).slice(0, 7)}`}>점검 보고서 보기</Link>
          )}
          <button className="btn gray" onClick={() => update({ status: "진행", completed_at: null, completed_by: null }, "다시 열었습니다")}>
            다시 열기
          </button>
        </>
      ) : (
        <>
          {me.role === "admin" && (
            <div className="card">
              <b>담당 직원 배정</b>
              <div style={{ marginTop: 10 }}>
                <Chips
                  items={users.map((u): [string, string] => [u.id, u.name])}
                  value={w.assignee_id}
                  onChange={(uid) => update({ assignee_id: uid, status: w.status === "접수" ? "배정" : w.status }, `${user(uid)?.name}에게 배정했습니다`)}
                />
              </div>
            </div>
          )}
          {w.status !== "진행" && (
            <button className="btn ghost" onClick={() => update({ assignee_id: me.id, status: "진행" }, "작업을 시작했습니다")}>작업 시작</button>
          )}
          <ProcessForm w={w} update={update} meId={me.id} toast={toast} />
        </>
      )}
    </>
  );
}

// 점검표와 처리 기록 입력. 배정·시작으로 w 가 바뀌어도 입력 중인 값은 유지된다.
function ProcessForm({ w, update, meId, toast }: {
  w: Work;
  update: (patch: Partial<Work>, msg: string) => Promise<boolean>;
  meId: string;
  toast: (m: string) => void;
}) {
  const isCheck = w.type === "정기점검";
  const [checklist, setChecklist] = useState<Checklist>(() => ({ ...makeChecklist(w.categories), ...(w.checklist ?? {}) }));
  const [action, setAction] = useState<ActionValues>({
    result: w.result ?? "",
    materials: w.materials ?? "",
    minutes: w.work_minutes != null ? String(w.work_minutes) : "",
  });
  const [saving, setSaving] = useState(false);

  const setItem = (cat: string, item: string, r: CheckResult) =>
    setChecklist((prev) => ({ ...prev, [cat]: { ...prev[cat], [item]: r } }));

  const fields = () => ({
    checklist: isCheck ? checklist : null,
    result: orNull(action.result),
    materials: orNull(action.materials),
    work_minutes: num(action.minutes),
  });

  async function run(patch: Partial<Work>, msg: string) {
    setSaving(true);
    await update(patch, msg);
    setSaving(false);
  }

  function complete() {
    if (isCheck) {
      const left = unchecked(checklist);
      if (left) return toast(`점검 항목 ${left}개가 비어 있습니다`);
    } else if (!action.result.trim()) return toast("작업 내용 / 결과를 입력하세요");
    run(
      { ...fields(), status: "완료", assignee_id: w.assignee_id || meId, completed_at: new Date().toISOString(), completed_by: meId },
      "완료 처리했습니다"
    );
  }

  return (
    <>
      {isCheck && (
        <>
          <h2 style={{ marginTop: 16 }}>점검표</h2>
          {w.categories.map((cat) => (
            <div className="card" key={cat}>
              <b>{cat}</b>
              {CHECK[cat].map((item) => (
                <div className="ck-item" key={item}>
                  <div style={{ marginBottom: 6 }}>{item}</div>
                  <Chips items={RESULTS.map((r) => [r, r])} value={checklist[cat]?.[item] ?? null} onChange={(r) => setItem(cat, item, r as CheckResult)} />
                </div>
              ))}
            </div>
          ))}
        </>
      )}
      <div className="card" style={{ marginTop: 12 }}>
        <b>처리 기록</b>
        <ActionFields isCheck={isCheck} v={action} set={(p) => setAction((prev) => ({ ...prev, ...p }))} />
        <button className="btn green" onClick={complete} disabled={saving}>{isCheck ? "점검 완료" : "작업 완료"}</button>
        <button className="btn gray" onClick={() => run(fields(), "저장했습니다")} disabled={saving}>임시 저장</button>
      </div>
    </>
  );
}
