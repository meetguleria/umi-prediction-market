import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import WagmiProvider from "@/components/WagmiProvider";

export const metadata: Metadata = {
  title: "PredictMI",
  description: "Prediction Markets on UMI Chain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <WagmiProvider>
          <Providers>
            <Navbar />
            {children}
          </Providers>
        </WagmiProvider>
      </body>
    </html>
  );
}
