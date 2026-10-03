import { CHECK } from "./constants";
import type { CheckResult, Checklist, Work } from "./types";

export const pad = (n: number) => String(n).padStart(2, "0");
export const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fmt = (iso: string) => {
  const d = new Date(iso);
  return `${ymd(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
export const todayStr = () => ymd(new Date());
export const num = (v: string) => (v.trim() === "" ? null : Math.max(0, parseInt(v, 10) || 0));
export const orNull = (v: string) => v.trim() || null;

const results = (c: Checklist) => Object.values(c).flatMap((o) => Object.values(o));
export const issues = (w: Work) => (w.checklist ? results(w.checklist).filter((v) => v === "이상").length : 0);
export const unchecked = (c: Checklist) => results(c).filter((v) => !v).length;

export function makeChecklist(cats: string[], fill: CheckResult | null = null): Checklist {
  const c: Checklist = {};
  cats.forEach((cat) => {
    c[cat] = {};
    CHECK[cat].forEach((item) => (c[cat][item] = fill));
  });
  return c;
}

// 미완료는 예정일이 빠른 순, 완료는 최근 완료 순
export function sortWork(a: Work, b: Work) {
  const da = a.status === "완료", db = b.status === "완료";
  if (da !== db) return da ? 1 : -1;
  if (!da) return a.scheduled_date.localeCompare(b.scheduled_date) || a.created_at.localeCompare(b.created_at);
  return (b.completed_at || "").localeCompare(a.completed_at || "");
}

// 완료된 정기점검 중 가장 최근 완료일 (YYYY-MM-DD)
export function lastInspection(ws: Pick<Work, "type" | "status" | "completed_at">[]) {
  const last = ws
    .filter((w) => w.type === "정기점검" && w.status === "완료" && w.completed_at)
    .map((w) => w.completed_at as string)
    .sort()
    .pop();
  return last ? ymd(new Date(last)) : null;
}

export const byDateDesc = (a: Work, b: Work) =>
  b.scheduled_date.localeCompare(a.scheduled_date) || b.created_at.localeCompare(a.created_at);
