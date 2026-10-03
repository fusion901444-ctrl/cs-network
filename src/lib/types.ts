export type Role = "admin" | "staff";
export type Status = "접수" | "배정" | "진행" | "완료";
export type WorkType = "정기점검" | "작업·공사" | "보안정책 변경";
export type CheckResult = "정상" | "이상" | "해당없음";

export type User = { id: string; name: string; role: Role };

export type Agency = {
  id: string;
  name: string;
  dept: string | null;
  contact_name: string | null;
  phone: string | null;
  address: string | null;
  contract_amount: number | null;
  inspection_cycle: string | null;
  memo: string | null;
  created_at: string;
};

// {분류: {항목: 결과}}, 아직 체크하지 않은 항목은 null
export type Checklist = Record<string, Record<string, CheckResult | null>>;

export type Work = {
  id: string;
  agency_id: string;
  type: WorkType;
  categories: string[];
  content: string;
  requester: string | null;
  basis: string | null;
  scheduled_date: string;
  status: Status;
  assignee_id: string | null;
  created_by: string | null;
  checklist: Checklist | null;
  result: string | null;
  materials: string | null;
  work_minutes: number | null;
  created_at: string;
  completed_at: string | null;
  completed_by: string | null;
};
