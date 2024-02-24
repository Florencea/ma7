import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import "tailwindcss/tailwind.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <head>
        <meta charSet="utf-8" />
        <title>MA7</title>
        <meta name="description" content="MA7" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body className="flex h-svh flex-col bg-white text-xs text-black dark:bg-black dark:text-white">
        {children}
      </body>
    </html>
  );
}
