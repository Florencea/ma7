import dynamic from "next/dynamic";
import "tailwindcss/tailwind.css";

const Providers = dynamic(() => import("./providers"), { ssr: false });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-black">
      <head>
        <meta charSet="utf-8" />
        <title>MA7</title>
        <meta name="description" content="MA7" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
