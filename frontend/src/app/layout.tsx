import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { MobileBlock } from "@/components/layout/MobileBlock";
import { Toaster } from "@/components/ui/Toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "OBX-STUDIO — Turn ideas into specs",
  description:
    "AI-powered idea interview tool for indie devs and students. Get grilled about your app idea, walk away with a full PRD, roadmap, and kanban board. Free.",
  keywords: ["indie dev", "app idea", "PRD generator", "product spec", "AI tools"],
  openGraph: {
    title: "OBX-STUDIO",
    description: "Turn your app idea into a full spec in minutes.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body>
        <AuthProvider>
          <MobileBlock>{children}</MobileBlock>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
