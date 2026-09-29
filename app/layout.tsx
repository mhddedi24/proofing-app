

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "NOUZZY | Client Photo Proofing",
    template: "%s | NOUZZY",
  },
  description: "Official Client Photo Proofing & Selection Portal by Nouzzzy",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased bg-[#0d0d0e] text-stone-200">
        {children}
      </body>
    </html>
  );
}