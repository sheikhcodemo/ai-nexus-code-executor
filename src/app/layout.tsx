import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Nexus - Multi-Language Code Execution",
  description: "AI-powered chat with JavaScript, Python, and WebAssembly code execution",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-slate-950">
        {children}
      </body>
    </html>
  );
}
