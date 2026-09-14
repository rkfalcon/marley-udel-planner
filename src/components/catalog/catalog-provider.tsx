"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { COURSES } from "@/lib/data/courses";
import type { Course } from "@/lib/types";
import type { CatalogSource } from "@/lib/catalog/types";
const CatalogContext = createContext<{
  courses: Course[];
  source: CatalogSource | null;
}>({ courses: COURSES, source: null });
export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [published, setPublished] = useState<{
    courses: Course[];
    source: CatalogSource | null;
  }>({ courses: [], source: null });
  useEffect(() => {
    let active = true;
    let pending = false;
    async function refresh() {
      if (pending) return;
      pending = true;
      try {
        let url = "/api/catalog";
        const courses: Course[] = [];
        let source: CatalogSource | null = null;
        for (let page = 0; page < 30; page++) {
          const response = await fetch(url, {
            cache: "no-store",
            signal: AbortSignal.timeout(15000),
          });
          if (!response.ok) return;
          const data = await response.json();
          if (!Array.isArray(data.courses)) return;
          if (!data.version) {
            if (active) setPublished({ courses: [], source: null });
            return;
          }
          courses.push(...data.courses);
          source = data.source;
          if (data.nextOffset === null) {
            if (active) setPublished({ courses, source });
            return;
          }
          url = `/api/catalog?version=${encodeURIComponent(data.version)}&offset=${data.nextOffset}`;
        }
      } catch {
        /* Keep the last verified list available during network failures. */
      } finally {
        pending = false;
      }
    }
    void refresh();
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    window.addEventListener("catalog-updated", onFocus);
    const timer = window.setInterval(onFocus, 300000);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("catalog-updated", onFocus);
    };
  }, []);
  const value = useMemo(
    () => ({
      source: published.source,
      courses: published.source
        ? [
            ...COURSES.filter((c) => c.school === "brookdale"),
            ...published.courses,
          ]
        : COURSES,
    }),
    [published],
  );
  return (
    <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
  );
}
export const useCatalog = () => useContext(CatalogContext);
