import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Vi bruker Inter-fonten, som er moderne og ser bra ut på alle skjermer
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Challenge 2026 | Emil vs Jørgen",
  description: "Live sporing av nyttårsforsettene for 2026",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="no" className="dark">
      <body
        className={`${inter.className} bg-[#0f172a] text-slate-100 antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
