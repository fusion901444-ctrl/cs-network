import type { Metadata, Viewport } from "next";
import { AppProvider } from "@/components/AppProvider";
import { Shell } from "@/components/Shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "CS 국가기관 네트워크망 관리 V1",
  description: "CS시스템(주) 정기점검·작업·보안정책 변경 관리",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1e3a8a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <body>
        <AppProvider>
          <Shell>{children}</Shell>
        </AppProvider>
      </body>
    </html>
  );
}
