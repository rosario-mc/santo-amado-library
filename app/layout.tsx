import type { Metadata } from "next";
import { Fredoka, Quicksand } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";
import Footer from "@/components/footer";
import MouseGlow from "@/components/mouse-glow";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "LibroLandia",
  description: "Your personal library and games collection!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${fredoka.variable} ${quicksand.variable} antialiased min-h-screen flex flex-col`}
      >
        {/* Animated background blobs */}
        <div className="bg-blobs" aria-hidden="true">
          <div className="blob blob-1" />
          <div className="blob blob-2" />
          <div className="blob blob-3" />
          <div className="blob blob-4" />
        </div>

        <Header/>
        <MouseGlow />
        <div className="relative z-10 flex flex-col flex-1">
          {children}
        </div>
        <Footer/>
      </body>
    </html>
  );
}
