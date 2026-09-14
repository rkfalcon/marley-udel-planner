import type { Course } from "../types";
export interface CatalogSource {
  id: string;
  year: string;
  home: string;
  courses: string;
  programs: string;
}
export interface SourceDocument {
  url: string;
  title: string;
  text: string;
  hash: string;
}
export interface CatalogJob {
  source: CatalogSource;
  pages: string[];
  visited: string[];
  expandedPages?: string[];
  prefixes: string[];
  links: Record<string, string>;
  courses: Course[];
  startedAt: string;
}
export interface CatalogState {
  activeVersion?: string;
  previousVersion?: string;
  paused?: boolean;
  lastAttempt?: string;
  lastSuccess?: string;
  nextCheck?: string;
  error?: string;
  job?: CatalogJob;
  source?: CatalogSource;
  courseCount?: number;
  departmentCount?: number;
  changes?: { added: number; removed: number; changed: number };
  requirementsError?: string;
  requirements?: {
    checkedAt: string;
    documents: SourceDocument[];
    previousDocuments?: SourceDocument[];
    changed: boolean;
    message: string;
  };
}
export interface CatalogSnapshot {
  id: string;
  source: CatalogSource;
  courses: Course[];
  created_at: string;
}
