import type { Metadata, Viewport } from "next";
import { Geist as GeistSans, Geist_Mono as GeistMono } from "next/font/google";
import "./globals.css";
import { PwaRegister } from "@/app/_components/PwaRegister";

const geistSans = GeistSans({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = GeistMono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FA Pipeline",
  description: "FA reporting pipeline (Visit, Leads, Export)",

  applicationName: "FA Pipeline",
  manifest: "/manifest.webmanifest",

  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FA Pipeline",
  },

  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
