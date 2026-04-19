import type { Metadata } from "next";
import "./globals.css";

import { Providers } from "@/lib/providers";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export const metadata: Metadata = {
  title: "QueryLab — SQL Analyzer",
  description:
    "Analyze SQL queries, visualize execution plans, and benchmark performance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>
          <div className="flex flex-1 min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 app-bg">
              <Topbar />
              <main className="flex-1 overflow-auto px-6 py-6">
                {children}
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
