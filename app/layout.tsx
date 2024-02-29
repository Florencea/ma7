import { LocalizedStringProvider } from "@adobe/react-spectrum/i18n";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import "tailwindcss/tailwind.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MA7",
  description: "MA7",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-TW" className={inter.className}>
      <body id="__next">
        <LocalizedStringProvider locale="zh-TW" />
        {children}
      </body>
    </html>
  );
}
