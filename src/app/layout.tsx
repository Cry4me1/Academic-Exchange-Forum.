
import { Toaster } from "@/components/ui/sonner";
import "katex/dist/katex.min.css";
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";


const geistSans = localFont({
  src: [{ path: "./fonts/GeistVF.woff2", style: "normal" }],
  variable: "--font-geist-sans",
  display: "swap",
  preload: true,
});

const geistMono = localFont({
  src: [{ path: "./fonts/GeistMonoVF.woff2", style: "normal" }],
  variable: "--font-geist-mono",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "Scholarly - 学术论坛",
  description: "现代化学术交流平台，支持 LaTeX 公式、代码高亮和图表渲染",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
