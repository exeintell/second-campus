import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { Header } from "@/components/ui/Header";
import { SPARedirectHandler } from "@/components/SPARedirectHandler";
import { NotificationProvider } from "@/components/notifications/NotificationProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SECOCAM",
  description: "Circle management platform with real-time chat, DM, and event scheduling",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        {/* SPA redirect: restore real URL before React hydrates (GitHub Pages) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var r=sessionStorage.getItem('__spa_url');if(r){sessionStorage.removeItem('__spa_url');history.replaceState(null,'',r)}})()`,
          }}
        />
        {/* Prevent FOUC: apply dark class before React hydrates */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');document.documentElement.classList.toggle('dark',t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme:dark)').matches))}catch(e){}})()`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white dark:bg-black text-neutral-900 dark:text-neutral-100 min-h-screen`}
      >
        <ThemeProvider>
          <AuthProvider>
            <NotificationProvider>
              <SPARedirectHandler />
              <Header />
              {children}
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
