import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async headers() {
    return [
      {
        source: "/audio/:path*", // audioディレクトリ内のすべてのファイルが対象
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate", // 365日キャッシュ
          },
        ],
      },
    ];
  },
};

export default nextConfig;
