import { createContext, useContext } from "react";
import type { AdminSession } from "../data/sitePublication";

export type AdminAuthContext = {
  session: AdminSession;
  getSession: () => Promise<AdminSession>;
  logout: () => void;
  /** 발표용 둘러보기: 로그인 없이 화면만 연 상태. 서버 작업은 getSession에서 막힌다. */
  demo: boolean;
};
export const AdminContext = createContext<AdminAuthContext | null>(null);

export function useAdminAuth(): AdminAuthContext {
  const context = useContext(AdminContext);
  if (!context) throw new Error("관리자 로그인 상태가 없습니다.");
  return context;
}
