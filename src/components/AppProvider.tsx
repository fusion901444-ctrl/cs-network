"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import type { Agency, User } from "@/lib/types";

const ME_KEY = "cs_network_me";

type AppCtx = {
  ready: boolean;
  loadError: string | null;
  me: User | null;
  users: User[];
  agencies: Agency[];
  user: (id: string | null) => User | undefined;
  agency: (id: string | null) => Agency | undefined;
  login: (id: string) => void;
  logout: () => void;
  reloadAgencies: () => Promise<void>;
  toast: (msg: string) => void;
};

const Ctx = createContext<AppCtx | null>(null);

export function useApp() {
  const c = useContext(Ctx);
  if (!c) throw new Error("AppProvider 밖에서 useApp 사용");
  return c;
}

// Shell 이 사용자 선택 전에는 화면을 그리지 않으므로, 하위 화면에서는 me 가 항상 있다
export function useMe() {
  const { me } = useApp();
  if (!me) throw new Error("사용자 선택 전");
  return me;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [me, setMe] = useState<User | null>(null);
  const [msg, setMsg] = useState("");
  const [show, setShow] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const toast = useCallback((m: string) => {
    setMsg(m);
    setShow(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setShow(false), 1800);
  }, []);

  const reloadAgencies = useCallback(async () => {
    const { data, error } = await supabase.from("agencies").select("*").order("name");
    if (error) return toast("기관 목록을 불러오지 못했습니다: " + error.message);
    setAgencies(data);
  }, [toast]);

  useEffect(() => {
    if (!supabaseConfigured) return;
    Promise.all([
      supabase.from("users").select("*").order("role").order("name"),
      supabase.from("agencies").select("*").order("name"),
    ]).then(([u, a]) => {
      const err = u.error || a.error;
      if (err) setLoadError("데이터를 불러오지 못했습니다: " + err.message);
      const list = (u.data ?? []) as User[];
      setUsers(list);
      setAgencies((a.data ?? []) as Agency[]);
      setMe(list.find((x) => x.id === localStorage.getItem(ME_KEY)) ?? null);
      setReady(true);
    });
  }, []);

  const value: AppCtx = {
    ready: ready || !supabaseConfigured,
    loadError: supabaseConfigured ? loadError : "Supabase 연결 정보가 없습니다. cs-network/.env.local 파일을 만들어 주세요.",
    me,
    users,
    agencies,
    user: (id) => users.find((u) => u.id === id),
    agency: (id) => agencies.find((a) => a.id === id),
    login: (id) => {
      localStorage.setItem(ME_KEY, id);
      setMe(users.find((u) => u.id === id) ?? null);
    },
    logout: () => {
      localStorage.removeItem(ME_KEY);
      setMe(null);
    },
    reloadAgencies,
    toast,
  };

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className={`toast ${show ? "show" : ""}`}>{msg}</div>
    </Ctx.Provider>
  );
}
