import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'qfbdtgckfeuzwipuojoa.supabase.co', // Thầy chủ động thêm sẵn link Supabase của em vào đây để chuẩn bị cho Step 3 khi em tự tải ảnh lên nhé!
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;