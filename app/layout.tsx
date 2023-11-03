export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      style={{
        backgroundColor: "black",
        color: "white",
        fontSize: 14,
        lineHeight: 1.5,
      }}
    >
      <head>
        <meta charSet="utf-8" />
        <title>MA7</title>
        <meta name="description" content="MA7" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
