import type { Metadata } from "next";
import { apiUrl } from "@/lib/api";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Personal Site",
  description: "独立开发者的个人作品集与博客",
  icons: {
    icon: apiUrl("/api/favicon"),
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme-manual");var light;if(t==="light"||t==="dark"){light=t==="light"}else{var h=new Date().getHours();light=h>=7&&h<18}if(light)document.documentElement.classList.add("light");document.documentElement.dataset.theme=light?"light":"dark"}catch(e){document.documentElement.classList.add("light");document.documentElement.dataset.theme="light"}})()`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-bg-base text-text-primary">
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
