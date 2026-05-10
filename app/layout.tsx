import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    default: "Dompet Pintar — Manajemen Keuangan Cerdas",
    template: "%s | Dompet Pintar",
  },
  description:
    "Catat pengeluaran, kelola tabungan, dan pantau portofolio investasi dengan analitik AI. Platform manajemen keuangan #1 di Indonesia.",
  keywords: ["keuangan", "tabungan", "investasi", "budgeting", "fintech", "indonesia"],
  authors: [{ name: "Dompet Pintar" }],
  openGraph: {
    title: "Dompet Pintar — Manajemen Keuangan Cerdas",
    description: "Satu aplikasi, kendali penuh keuanganmu.",
    type: "website",
    locale: "id_ID",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className="h-full antialiased scroll-smooth">
      <head>
        {/* Preconnect for Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,700;0,9..144,900;1,9..144,300;1,9..144,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="min-h-full flex flex-col bg-[#F7F6F1] dark:bg-[#0C0C10] transition-colors duration-500"
        style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
      >
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-ESQLR58N76"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-ESQLR58N76');
          `}
        </Script>

        {children}
      </body>
    </html>
  );
}