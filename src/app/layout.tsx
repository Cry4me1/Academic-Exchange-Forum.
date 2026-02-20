import { CNYDecorations } from "@/components/theme/cny-decorations";
import { CNYProvider } from "@/components/theme/cny-provider";
import { Toaster } from "@/components/ui/sonner";
import "katex/dist/katex.min.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";



const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
        <CNYProvider>
          <CNYDecorations />
          {children}
          <Toaster />
        </CNYProvider>
      </body>
    </html>
  );
}
