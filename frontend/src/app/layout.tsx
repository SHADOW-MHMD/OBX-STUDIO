import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { MobileBlock } from "@/components/layout/MobileBlock";

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <AuthProvider>
          <MobileBlock>{children}</MobileBlock>
        </AuthProvider>
      </body>
    </html>
  );
}
