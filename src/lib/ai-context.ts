// AI 요청에 넣을 점검·작업 기록을 사람이 읽는 텍스트로 정리 (서버 전용)
import { supabase } from "./supabase";
import type { Agency, User, Work } from "./types";
// 서버(Vercel)는 UTC 로 돌기 때문에 날짜는 한국 시간 기준으로 계산
const ymd = (d: Date) => new Date(d.getTime() + 9 * 3600_000).toISOString().slice(0, 10);

const issueItems = (w: Work) =>
  w.checklist
    ? Object.entries(w.checklist).flatMap(([cat, items]) =>
        Object.entries(items).filter(([, r]) => r === "이상").map(([item]) => `${cat}-${item}`))
    : [];

function workLine(w: Work, agencyName: string, userName: (id: string | null) => string) {
  const done = w.completed_at ? ` / 완료 ${ymd(new Date(w.completed_at))} ${userName(w.completed_by)}` : "";
  const parts = [
    `[${w.status}] 예정 ${w.scheduled_date}${done}`,
    agencyName,
    w.type,
    `장비: ${w.categories.join(", ")}`,
    `내용: ${w.content}`,
  ];
  if (w.assignee_id && !w.completed_at) parts.push(`담당: ${userName(w.assignee_id)}`);
  if (w.requester) parts.push(`요청자: ${w.requester}`);
  if (w.basis) parts.push(`근거: ${w.basis}`);
  if (w.checklist) {
    const issues = issueItems(w);
    if (w.status === "완료") parts.push(issues.length ? `이상 항목: ${issues.join(", ")}` : "이상 항목: 없음");
  }
  if (w.result) parts.push(`${w.type === "정기점검" ? "점검 의견" : "작업 결과"}: ${w.result}`);
  if (w.materials) parts.push(`사용자재: ${w.materials}`);
  return "- " + parts.join(" | ");
}

function agencyBlock(a: Agency) {
  const rows = [
    `기관명: ${a.name}`,
    a.dept && `담당부서: ${a.dept}`,
    a.inspection_cycle && `점검주기: ${a.inspection_cycle}`,
    a.memo && `특이사항: ${a.memo}`,
  ].filter(Boolean);
  return rows.join("\n");
}

async function load(agencyId?: string) {
  let wq = supabase.from("works").select("*").order("scheduled_date", { ascending: false }).limit(500);
  if (agencyId) wq = wq.eq("agency_id", agencyId);
  const [w, a, u] = await Promise.all([
    wq,
    supabase.from("agencies").select("*"),
    supabase.from("users").select("*"),
  ]);
  const err = w.error || a.error || u.error;
  if (err) throw new Error(err.message);
  const agencies = a.data as Agency[], users = u.data as User[];
  return {
    works: w.data as Work[],
    agencies,
    agencyName: (id: string) => agencies.find((x) => x.id === id)?.name ?? "(알 수 없는 기관)",
    userName: (id: string | null) => users.find((x) => x.id === id)?.name ?? "미지정",
  };
}

// 기관 상세: 해당 기관의 전체 이력
export async function agencyContext(agencyId: string) {
  const d = await load(agencyId);
  const a = d.agencies.find((x) => x.id === agencyId);
  if (!a) throw new Error("기관을 찾을 수 없습니다");
  const lines = d.works.map((w) => workLine(w, a.name, d.userName));
  return `오늘: ${ymd(new Date())}\n\n## 기관 정보\n${agencyBlock(a)}\n\n## 작업 이력 (최신순, ${lines.length}건)\n${lines.join("\n") || "(이력 없음)"}`;
}

// 점검 보고서: 해당 월에 완료된 정기점검 (+ 직전 이력 일부)
export async function reportContext(agencyId: string, month: string) {
  const d = await load(agencyId);
  const a = d.agencies.find((x) => x.id === agencyId);
  if (!a) throw new Error("기관을 찾을 수 없습니다");
  const inspections = d.works.filter((w) => w.type === "정기점검" && w.status === "완료" && w.completed_at);
  const thisMonth = inspections.filter((w) => ymd(new Date(w.completed_at!)).startsWith(month));
  const before = inspections.filter((w) => ymd(new Date(w.completed_at!)) < `${month}-01`).slice(0, 6);
  const otherWorks = d.works.filter((w) => w.type !== "정기점검" && w.scheduled_date.startsWith(month));
  return [
    `보고 대상 월: ${month}`,
    `## 기관 정보\n${agencyBlock(a)}`,
    `## 이번 달 정기점검 (${thisMonth.length}건)\n${thisMonth.map((w) => workLine(w, a.name, d.userName)).join("\n") || "(없음)"}`,
    `## 이번 달 기타 작업\n${otherWorks.map((w) => workLine(w, a.name, d.userName)).join("\n") || "(없음)"}`,
    `## 이전 정기점검 (참고, 최근 ${before.length}건)\n${before.map((w) => workLine(w, a.name, d.userName)).join("\n") || "(없음)"}`,
  ].join("\n\n");
}

// 기술지원 질문: 전체 기관의 기록
export async function allContext() {
  const d = await load();
  const lines = d.works.map((w) => workLine(w, d.agencyName(w.agency_id), d.userName));
  return `오늘: ${ymd(new Date())}\n\n## 등록 기관 (${d.agencies.length}곳)\n${d.agencies.map((a) => a.name).join(", ")}\n\n## 전체 점검·작업 기록 (최신순, ${lines.length}건)\n${lines.join("\n") || "(기록 없음)"}`;
}
