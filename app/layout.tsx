import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// 1. Thêm dòng này để kết nối với thanh Navbar em vừa tạo
import Navbar from "./components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SpotShare",
  description: "Share your favorite spots with everyone",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        {/* 2. Đặt Navbar ở ngay đầu body để nó luôn nằm cố định ở đỉnh trang web */}
        <Navbar />
        
        {/* 3. Phần nội dung trang web sẽ nằm ở dưới và co giãn mượt mà */}
        <main className="flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}