"use client";

import { useRouter } from "next/navigation";
import { useApp } from "@/components/AppProvider";
import { NetworkArt } from "@/components/NetworkArt";

export default function LoginPage() {
  const { users, login } = useApp();
  const router = useRouter();
  return (
    <div className="login">
      <NetworkArt />
      <h1 className="title">CS 국가기관 네트워크망 관리</h1>
      <p className="muted">정기점검 · 작업·공사 · 보안정책 변경 · 사용자를 선택하세요</p>
      {users.map((u) => (
        <button
          key={u.id}
          className={`btn ${u.role === "admin" ? "" : "ghost"}`}
          onClick={() => { login(u.id); router.replace("/"); }}
        >
          {u.name} · {u.role === "admin" ? "관리자" : "현장기사"}
        </button>
      ))}
      {!users.length && <p className="muted">등록된 직원이 없습니다. Supabase에서 schema.sql을 실행했는지 확인하세요.</p>}
    </div>
  );
}
