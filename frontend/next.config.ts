import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Azure Static Web Appsへ静的ファイルとして配置する
  output: "export",

  // /night/のように末尾スラッシュ付きで出力する
  trailingSlash: true,
};

export default nextConfig;
