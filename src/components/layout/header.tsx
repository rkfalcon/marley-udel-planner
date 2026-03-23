"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, Menu, BookOpen, Calendar, ArrowRightLeft, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/requirements", label: "Requirements", icon: BookOpen },
  { href: "/plan/new", label: "Plan Builder", icon: Calendar },
  { href: "/transfer", label: "Transfer Credits", icon: ArrowRightLeft },
];

export function Header() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-[#00539F] shadow-md">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <GraduationCap className="h-7 w-7 text-white" />
          <div className="flex flex-col leading-tight">
            <span className="text-white font-bold text-base sm:text-lg tracking-tight group-hover:opacity-90 transition-opacity">
              UDel Degree Planner
            </span>
            <span className="text-blue-200 text-xs font-medium">
              Marley Falcon
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Button
              key={href}
              variant="ghost"
              asChild
              className={cn(
                "text-white hover:bg-white/20 hover:text-white gap-1.5 font-medium transition-colors",
                isActive(href) && "bg-white/25 text-white underline underline-offset-4"
              )}
            >
              <Link href={href}>
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            </Button>
          ))}
        </nav>

        {/* Mobile Hamburger */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 hover:text-white"
                aria-label="Open navigation menu"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 bg-white">
              <SheetHeader className="mb-6">
                <SheetTitle className="flex items-center gap-2 text-[#00539F]">
                  <GraduationCap className="h-5 w-5" />
                  UDel Degree Planner
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1">
                {navLinks.map(({ href, label, icon: Icon }) => (
                  <Button
                    key={href}
                    variant="ghost"
                    asChild
                    className={cn(
                      "justify-start gap-2 text-gray-700 hover:text-[#00539F] hover:bg-blue-50 font-medium",
                      isActive(href) &&
                        "bg-blue-50 text-[#00539F] font-semibold"
                    )}
                  >
                    <Link href={href}>
                      <Icon className="h-4 w-4" />
                      {label}
                    </Link>
                  </Button>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
