import type { Metadata } from "next";
import type { ReactNode } from "react";
import "tailwindcss/tailwind.css";

export const metadata: Metadata = {
  title: "MA7",
  description: "MA7",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-TW">
      <body id="__next">{children}</body>
    </html>
  );
}
