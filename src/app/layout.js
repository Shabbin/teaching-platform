// app/layout.js (server component, no 'use client')
import { Poppins } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

import ReduxProviderWrapper from '../app/redux/ReduxProviderWrapper'; // your client wrapper component

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "700"], // Keep multiple weights for flexibility
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${poppins.variable} ${geistMono.variable}`}>
      <body
        className="m-0 p-0 min-h-screen w-screen h-screen"
        suppressHydrationWarning={true} // 👈 This silences extension/dynamic mismatch warnings
      >
        <ReduxProviderWrapper>{children}</ReduxProviderWrapper>
      </body>
    </html>
  );
}
