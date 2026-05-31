import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { getServerCurrency } from "@/lib/utils/currency-server";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TRAVU — AI travel super-app",
  description:
    "Search, book, and track flights with an AI travel agent. Stays, cars and more coming soon.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const currency = await getServerCurrency();
  return (
    <html lang="en" suppressHydrationWarning className={`${geist.variable} antialiased`}>
      <body className="flex min-h-screen flex-col font-sans">
        <Providers initialCurrency={currency}>
          <Navbar />
          <main className="flex-1 pb-20 md:pb-0">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
