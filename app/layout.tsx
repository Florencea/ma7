import { LocalizedStringProvider } from "@adobe/react-spectrum/i18n";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "tailwindcss/tailwind.css";

export const metadata: Metadata = {
  title: "MA7",
  description: "MA7",
};

const RootLayout = ({ children }: { children: ReactNode }) => {
  return (
    <html lang="zh-TW">
      <body id="__next">
        <LocalizedStringProvider locale="zh-TW" />
        {children}
      </body>
    </html>
  );
};

export default RootLayout;
