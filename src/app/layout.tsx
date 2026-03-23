import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Marley's UDel Degree Planner",
  description:
    "Plan your University of Delaware Cognitive Science degree. Track requirements, manage transfer credits, and build your semester schedule.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(inter.variable, "h-full antialiased")}>
      <body className="min-h-full flex flex-col font-sans bg-gray-50">
        <TooltipProvider>
          <Header />
          <main className="flex-1">
            <div className="max-w-7xl mx-auto px-4 py-8">{children}</div>
          </main>
          <Footer />
        </TooltipProvider>
      </body>
    </html>
  );
}
