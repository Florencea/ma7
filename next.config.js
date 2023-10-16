const isDev = !(process.env.NODE_ENV === "production");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: isDev ? undefined : "export",
  reactStrictMode: true,
  images: {
    loaderFile: isDev ? "imgProxy.js" : undefined,
    unoptimized: !isDev,
  },
  compiler: {
    removeConsole: !isDev,
  },
  redirects: isDev
    ? async () => [
        {
          source: "/data.json",
          destination: "https://ma7.pages.dev/data.json",
          permanent: true,
        },
      ]
    : undefined,
};

module.exports = nextConfig;
