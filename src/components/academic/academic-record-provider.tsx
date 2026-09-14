"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { activeCourses, type AcademicRecord } from "@/lib/academic-record";

interface RecordContext {
  record: AcademicRecord | null;
  courses: ReturnType<typeof activeCourses>;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<AcademicRecord | null>;
  acceptRecord: (record: AcademicRecord) => void;
}
const Context = createContext<RecordContext | null>(null);
export function AcademicRecordProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [record, setRecord] = useState<AcademicRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();
  const sequence = useRef(0);
  const channel = useRef<BroadcastChannel | null>(null);
  const acceptRecord = useCallback((next: AcademicRecord) => {
    sequence.current++;
    setRecord((prev) => (prev && prev.revision > next.revision ? prev : next));
    setError(null);
    setLoading(false);
    channel.current?.postMessage({ revision: next.revision });
  }, []);
  const refresh = useCallback(async () => {
    const ticket = ++sequence.current;
    try {
      const res = await fetch("/api/academic-record", {
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Unable to load the academic record.");
      if (ticket === sequence.current) {
        setRecord((prev) =>
          prev && prev.revision >= data.revision ? prev : data,
        );
        setError(null);
      }
      return data as AcademicRecord;
    } catch (e) {
      if (ticket === sequence.current)
        setError(
          e instanceof Error
            ? e.message
            : "Unable to load the academic record.",
        );
      return null;
    } finally {
      if (ticket === sequence.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
    const focus = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    window.addEventListener("focus", focus);
    document.addEventListener("visibilitychange", focus);
    const interval = setInterval(focus, 30000);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", focus);
      document.removeEventListener("visibilitychange", focus);
    };
  }, [refresh, pathname]);
  useEffect(() => {
    if (typeof window.BroadcastChannel !== "function") return;
    const updates = new window.BroadcastChannel("marley-academic-record");
    channel.current = updates;
    updates.onmessage = () => {
      void refresh();
    };
    return () => {
      channel.current = null;
      updates.close();
    };
  }, [refresh]);
  const courses = useMemo(
    () => (record ? activeCourses(record.courses) : []),
    [record],
  );
  const value = useMemo(
    () => ({ record, courses, loading, error, refresh, acceptRecord }),
    [record, courses, loading, error, refresh, acceptRecord],
  );
  return (
    <Context.Provider value={value}>
      {error && (
        <div
          role="alert"
          className="mx-auto max-w-5xl rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 print:hidden"
        >
          {error} {record && "Showing the last loaded record."}{" "}
          <button
            className="ml-2 font-semibold underline"
            onClick={() => void refresh()}
          >
            Retry
          </button>
        </div>
      )}
      {!record && pathname !== "/admin" ? (
        <div className="p-12 text-center text-slate-500">
          {loading
            ? "Loading academic record…"
            : "Progress will appear when the academic record is available."}
        </div>
      ) : (
        children
      )}
    </Context.Provider>
  );
}
export function useAcademicRecord() {
  const context = useContext(Context);
  if (!context) throw new Error("AcademicRecordProvider is required.");
  return context;
}
