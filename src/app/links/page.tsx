'use client';

import { ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const LINKS = [
  {
    title: 'UD Stellic Login',
    description: 'Degree planning and audit tool for University of Delaware students',
    url: 'https://www.udel.edu/students/dem/stellic/',
    color: 'bg-blue-50 border-blue-200 hover:border-blue-400',
    iconColor: 'text-blue-600',
  },
  {
    title: 'Cognitive Science (BS)',
    description: 'Full degree requirements for the Cognitive Science BS major',
    url: 'https://catalog.udel.edu/preview_program.php?catoid=90&poid=78328',
    color: 'bg-indigo-50 border-indigo-200 hover:border-indigo-400',
    iconColor: 'text-indigo-600',
  },
  {
    title: 'PPSLP Specialization',
    description: 'Pre-Professional Speech-Language Pathology specialization requirements',
    url: 'https://catalog.udel.edu/preview_program.php?catoid=90&poid=77957',
    color: 'bg-purple-50 border-purple-200 hover:border-purple-400',
    iconColor: 'text-purple-600',
  },
  {
    title: 'CGSC BS — All Specializations Four-Year Plan',
    description: 'Official four-year plan for all Cognitive Science BS specializations',
    url: 'https://catalog.udel.edu/content.php?catoid=90&navoid=28042',
    color: 'bg-violet-50 border-violet-200 hover:border-violet-400',
    iconColor: 'text-violet-600',
  },
  {
    title: 'UD Course Catalog',
    description: 'Browse all courses offered at the University of Delaware',
    url: 'https://catalog.udel.edu/content.php?catoid=94&navoid=34643',
    color: 'bg-sky-50 border-sky-200 hover:border-sky-400',
    iconColor: 'text-sky-600',
  },
  {
    title: 'Transfer Credit Matrix',
    description: 'Look up how courses from other schools transfer to UDel',
    url: 'https://udapps.nss.udel.edu/transfercredit/',
    color: 'bg-teal-50 border-teal-200 hover:border-teal-400',
    iconColor: 'text-teal-600',
  },
  {
    title: 'Brookdale CC Courses',
    description: 'Browse and search courses at Brookdale Community College',
    url: 'https://selfservice.brookdalecc.edu/Student/Courses',
    color: 'bg-emerald-50 border-emerald-200 hover:border-emerald-400',
    iconColor: 'text-emerald-600',
  },
];

export default function LinksPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Useful Links</h1>
        <p className="text-sm text-muted-foreground">
          Quick access to University of Delaware and Brookdale CC resources
        </p>
      </div>

      <div className="grid gap-3">
        {LINKS.map((link) => (
          <a
            key={link.url}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block group"
          >
            <Card className={`transition-all duration-200 hover:shadow-md ${link.color}`}>
              <CardContent className="flex items-center gap-4 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-slate-800 group-hover:text-slate-900">
                    {link.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{link.description}</p>
                </div>
                <ExternalLink className={`h-4 w-4 shrink-0 ${link.iconColor} opacity-60 group-hover:opacity-100 transition-opacity`} />
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
    </div>
  );
}
