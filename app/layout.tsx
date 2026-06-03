import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";
import { Navbar } from "@/components/layout/Navbar";
import { StaysFooter } from "@/components/stays/landing/StaysFooter";
import { getServerCurrencyCookie } from "@/lib/utils/currency-server";
import { getServerLocation } from "@/lib/geo/ip-location";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://www.travunow.com"),
  title: {
    default: "Travu — AI travel super-app",
    template: "%s · Travu",
  },
  description:
    "Search, book, and track flights and stays with an AI travel agent. Hotels, homes, and more on Travu.",
  applicationName: "Travu",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Travu",
    url: "https://www.travunow.com",
    title: "Travu — AI travel super-app",
    description:
      "Search, book, and track flights and stays with an AI travel agent. Hotels, homes, and more on Travu.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Travu — AI travel super-app",
    description: "Search, book, and track flights and stays with an AI travel agent.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [location, cookieCurrency] = await Promise.all([
    getServerLocation(),
    getServerCurrencyCookie(),
  ]);
  const currency = cookieCurrency ?? location.currency;
  return (
    <html lang="en" suppressHydrationWarning className={`${geist.variable} antialiased`}>
      <body className="flex min-h-screen flex-col font-sans">
        <Providers
          initialCurrency={currency}
          location={location}
          hadCurrencyCookie={Boolean(cookieCurrency)}
        >
          <Navbar />
          <main className="flex-1 pb-20 md:pb-0">{children}</main>
          <StaysFooter />
        </Providers>
      </body>
    </html>
  );
}
