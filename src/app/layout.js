'use client';

import { Geist } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

import { Provider } from "react-redux";
import { store } from "../app/redux/store";
import UserRehydrator from "../app/components/UserRehydrator";
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
      <body>
        <Provider store={store}>
          <UserRehydrator />
          {children}
        </Provider>
      </body>
    </html>
  );
}