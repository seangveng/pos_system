import type React from "react";
import type { Metadata } from "next";
import { Geist, Kantumruy_Pro } from "next/font/google";
import { Suspense } from "react";

import "./globals.css";

import { CartProvider } from "@/contexts/cart-context";
import { SidebarProvider } from "@/contexts/sidebar-contexts";
import { LanguageProvider } from "@/contexts/language-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const kantumruy = Kantumruy_Pro({
  variable: "--font-kantumruy",
  subsets: ["khmer", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Happy Birds - POS Dashboard",
  description: "Happy Birds point of sale and business management system",
};

const themeScript = `
(function () {
  try {
    var stored = localStorage.getItem("pos-settings");
    if (!stored) return;

    var settings = JSON.parse(stored);
    var darkMode = settings?.appearance?.darkMode;
    var root = document.documentElement;

    root.classList.toggle("dark", Boolean(darkMode));
  } catch (error) {
    console.error("Failed to initialize theme:", error);
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>

      <body
        className={`${geistSans.variable} ${kantumruy.variable}`}
        suppressHydrationWarning
      >
        <LanguageProvider>
          <CartProvider>
            <SidebarProvider>
              <Suspense fallback={null}>{children}</Suspense>
            </SidebarProvider>
          </CartProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
