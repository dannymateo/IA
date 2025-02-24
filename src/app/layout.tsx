import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import Loading from "@/components/Loading";
import { Suspense } from "react";
import { Github } from "lucide-react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IA Tools",
  description: "Herramientas de Inteligencia Artificial",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased pb-20`}>
        <Suspense fallback={<Loading />}>
          {children}
        </Suspense>
        <BottomNav />
        
        <footer className="fixed bottom-20 w-full text-black py-3">
          <div className="container mx-auto px-4 flex items-center justify-center gap-3 text-base font-medium">
            <span>Desarrollado por Danny Hernández</span>
            <a 
              href="https://github.com/dannymateo/IA.git"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center hover:text-blue-600 transition-colors"
            >
              <Github size={24} />
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
}
