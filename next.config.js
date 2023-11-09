const isDev = !(process.env.NODE_ENV === "production");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: isDev ? undefined : "export",
  reactStrictMode: true,
  compiler: {
    removeConsole: !isDev,
  },
  eslint: {
    ignoreDuringBuilds: !isDev,
    dirs: ["."],
  },
  typescript: {
    ignoreBuildErrors: !isDev,
  },
  redirects: isDev
    ? async () =>
        Promise.resolve([
          {
            source: "/data.json",
            destination: "https://ma7.pages.dev/data.json",
            permanent: true,
          },
          {
            source: "/img/:path*",
            destination: "https://ma7.pages.dev/img/:path*",
            permanent: true,
          },
        ])
    : undefined,
};

module.exports = nextConfig;
