"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useApp } from "./AppProvider";
import { CubeLogo } from "./NetworkArt";

export function Shell({ children }: { children: React.ReactNode }) {
  const { ready, loadError, me, logout } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/login";

  useEffect(() => {
    if (ready && !loadError && !me && !isLogin) router.replace("/login");
  }, [ready, loadError, me, isLogin, router]);

  if (!ready) return <p className="muted center">불러오는 중…</p>;
  if (loadError)
    return (
      <div className="login">
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>연결 오류</h1>
        <p className="muted">{loadError}</p>
        <button className="btn" onClick={() => location.reload()}>다시 시도</button>
      </div>
    );
  if (isLogin) return <>{children}</>;
  if (!me) return null;

  const listOn = pathname === "/" || pathname.startsWith("/w/");
  const agencyOn = ["/agencies", "/a/", "/report/"].some((p) => pathname.startsWith(p));
  return (
    <>
      <div className="wrap">
        <header>
          <h1><CubeLogo />CS 네트워크망 관리 V1</h1>
          <div>
            <span className="me">{me.name}</span>
            <button onClick={() => { logout(); router.replace("/login"); }}>사용자 변경</button>
          </div>
        </header>
        <main>{children}</main>
      </div>
      <nav>
        <div className="in">
          <Link href="/" className={listOn ? "on" : ""}><span className="ico">📋</span>작업 목록</Link>
          <Link href="/agencies" className={agencyOn ? "on" : ""}><span className="ico">🏛</span>기관</Link>
          <Link href="/new" className="plus"><span>+ 작업 등록</span></Link>
          <Link href="/ai" className={pathname === "/ai" ? "on" : ""}><span className="ico">🤖</span>AI 질문</Link>
        </div>
      </nav>
    </>
  );
}
