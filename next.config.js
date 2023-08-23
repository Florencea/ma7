/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  reactStrictMode: true,
  images: {
    loaderFile:
      process.env.NODE_ENV === "production" ? undefined : "imgProxy.js",
    unoptimized: process.env.NODE_ENV === "production",
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
};

module.exports = nextConfig;
