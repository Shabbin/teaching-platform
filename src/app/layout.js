// app/layout.js (server component, no 'use client')
import { Geist } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

import ReduxProviderWrapper from '../app/redux/ReduxProviderWrapper'; // your client wrapper component

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="m-0 p-0 min-h-screen w-screen h-screen">
        <ReduxProviderWrapper>{children}</ReduxProviderWrapper>
      </body>
    </html>
  );
}
