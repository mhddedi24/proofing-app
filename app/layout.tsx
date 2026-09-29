import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NOUZZY | Client Photo Proofing",
  description: "Official Client Photo Proofing & Selection Portal",
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