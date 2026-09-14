'use client';

import { useCatalog } from '@/components/catalog/catalog-provider';
import { CATALOG } from '@/lib/data/catalog';
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
    description: '2026–2027 Cognitive Science BS and Speech-Language Pathology concentration',
    url: CATALOG.program,
    color: 'bg-indigo-50 border-indigo-200 hover:border-indigo-400',
    iconColor: 'text-indigo-600',
  },
  {
    title: 'Speech-Language Pathology Concentration',
    description: '2026–2027 concentration requirements, included in the complete degree page',
    url: CATALOG.program,
    color: 'bg-purple-50 border-purple-200 hover:border-purple-400',
    iconColor: 'text-purple-600',
  },
  {
    title: 'CGSC BS — All Specializations Four-Year Plan',
    description: 'Official 2026 four-year plan for Cognitive Science BS concentrations',
    url: CATALOG.fourYearPlan,
    color: 'bg-violet-50 border-violet-200 hover:border-violet-400',
    iconColor: 'text-violet-600',
  },
  {
    title: 'UD Course Catalog',
    description: 'Browse the 2026–2027 Undergraduate Catalog',
    url: CATALOG.courses,
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
  const { source } = useCatalog();
  const links = LINKS.map(link => source && link.title === "UD Course Catalog" ? { ...link, url: source.courses, description: `Browse the ${source.year} Undergraduate Catalog` } : link);
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Useful Links</h1>
        <p className="text-sm text-muted-foreground">
          Quick access to University of Delaware and Brookdale CC resources
        </p>
      </div>

      <div className="grid gap-3">
        {links.map((link) => (
          <a
            key={link.title}
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
