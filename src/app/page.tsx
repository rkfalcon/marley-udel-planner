'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { CreditProgress } from '@/components/dashboard/credit-progress';
import { RequirementsOverview } from '@/components/dashboard/requirements-overview';
import { PlansList } from '@/components/dashboard/plans-list';
import { MARLEY_PROFILE } from '@/lib/data/marley-progress';
import {
  GraduationCap,
  BookOpen,
  ArrowRight,
  MapPin,
  Star,
  Briefcase,
  ChevronRight,
} from 'lucide-react';

function ProfileBadge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full',
        className
      )}
    >
      {children}
    </span>
  );
}

function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
        {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">

        {/* Hero / Profile Section */}
        <section>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-[#00539F] via-blue-600 to-indigo-700 text-white overflow-hidden relative">
            <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-white/5" />
            <div className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full bg-white/5" />

            <CardContent className="relative px-6 sm:px-8 py-8">
              <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                <div className="flex-shrink-0 w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-inner">
                  <span className="text-3xl font-bold text-white select-none">
                    {MARLEY_PROFILE.name.split(' ').map((n) => n[0]).join('')}
                  </span>
                </div>

                <div className="flex-1 min-w-0 space-y-3">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                      {MARLEY_PROFILE.name}
                    </h1>
                    <p className="text-blue-200 text-sm mt-0.5">
                      {MARLEY_PROFILE.major} &middot; {MARLEY_PROFILE.level}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <ProfileBadge className="bg-white/15 text-blue-50 border border-white/20">
                      <MapPin className="w-3 h-3" />
                      {MARLEY_PROFILE.campus} Campus
                    </ProfileBadge>
                    <ProfileBadge className="bg-white/15 text-blue-50 border border-white/20">
                      <Star className="w-3 h-3 fill-current" />
                      GPA {MARLEY_PROFILE.cgpa.toFixed(3)}
                    </ProfileBadge>
                    <ProfileBadge className="bg-white/15 text-blue-50 border border-white/20">
                      <Briefcase className="w-3 h-3" />
                      {MARLEY_PROFILE.specialization}
                    </ProfileBadge>
                  </div>
                </div>

                <div className="sm:text-right text-sm space-y-1.5">
                  <p className="text-blue-200 text-xs uppercase tracking-wide font-medium">
                    Academic Advisor
                  </p>
                  <p className="text-white font-semibold">{MARLEY_PROFILE.advisor}</p>
                  <p className="text-blue-300 text-xs">
                    Catalog: {MARLEY_PROFILE.catalogTerm}
                  </p>
                  <p className="text-blue-300 text-xs">
                    ID: {MARLEY_PROFILE.studentId}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Quick Actions */}
        <section>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/requirements"
              className={cn(
                buttonVariants({ variant: 'outline' }),
                'border-slate-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-colors shadow-sm'
              )}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              View All Requirements
              <ChevronRight className="w-3.5 h-3.5 ml-1 opacity-60" />
            </Link>
            <Link
              href="/transfer"
              className={cn(
                buttonVariants({ variant: 'outline' }),
                'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-colors shadow-sm'
              )}
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Brookdale Transfer Lookup
              <ChevronRight className="w-3.5 h-3.5 ml-1 opacity-60" />
            </Link>
          </div>
        </section>

        {/* Credit Progress + Requirements Overview */}
        <section>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <Card className="lg:col-span-2 border-slate-100 shadow-sm">
              <CardHeader className="pb-2 px-6 pt-6">
                <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                  <GraduationCap className="w-4.5 h-4.5 text-blue-500" />
                  Credit Progress
                </CardTitle>
                <CardDescription className="text-slate-400">
                  {MARLEY_PROFILE.totalCreditsRequired} total credits required
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <CreditProgress />
              </CardContent>
            </Card>

            <div className="lg:col-span-3 space-y-4">
              <SectionHeader
                title="Requirements Overview"
                description="Progress across all degree requirement categories"
                action={
                  <Link
                    href="/requirements"
                    className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'text-slate-500 hover:text-blue-600 -mt-0.5')}
                  >
                    View all
                    <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                  </Link>
                }
              />
              <RequirementsOverview />
            </div>
          </div>
        </section>

        {/* Saved Plans */}
        <section className="space-y-4">
          <SectionHeader
            title="Degree Plans"
            description="Your saved graduation roadmaps"
            action={
              <Link
                href="/plan/new"
                className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'text-slate-500 hover:text-blue-600 -mt-0.5')}
              >
                New plan
                <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </Link>
            }
          />
          <PlansList />
        </section>
      </div>
    </div>
  );
}
