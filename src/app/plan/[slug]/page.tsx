'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Save,
  Copy,
  CheckCheck,
  GraduationCap,
  PanelRightOpen,
  PanelRightClose,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PlanGrid } from '@/components/planner/plan-grid';
import { GraduationTracker } from '@/components/planner/graduation-tracker';
import { usePlan } from '@/hooks/use-plan';
import { PlanCourse } from '@/lib/types';

export default function PlanEditorPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;

  const { plan, loading, loadPlan, addCourse, removeCourse, savePlan } =
    usePlan();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveMode, setSaveMode] = useState<'choose' | 'update' | 'new' | 'done'>('choose');
  const [pin, setPin] = useState('');
  const [newPlanName, setNewPlanName] = useState('');
  const [pinError, setPinError] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [savedSlug, setSavedSlug] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const isExistingPlan = typeof window !== 'undefined' && !!JSON.parse(localStorage.getItem('udel-plans') || '{}')[slug];

  // Load plan on mount
  useEffect(() => {
    if (!slug) return;

    if (slug === 'new') {
      router.replace('/plan/new');
      return;
    }

    loadPlan(slug).then((loaded) => {
      setInitialLoadDone(true);
      if (!loaded) {
        // Plan not found — could redirect or show error
      }
    });
  }, [slug, loadPlan, router]);

  const handleAddCourse = useCallback(
    (
      semesterId: string,
      course: Omit<PlanCourse, 'id' | 'planSemesterId'>
    ) => {
      addCourse(semesterId, course);
    },
    [addCourse]
  );

  const handleRemoveCourse = useCallback(
    (semesterId: string, courseId: string) => {
      removeCourse(semesterId, courseId);
    },
    [removeCourse]
  );

  const handleSaveUpdate = async () => {
    if (!pin.trim() || pin.length < 4) {
      setPinError('PIN must be at least 4 characters');
      return;
    }
    setPinError('');
    setSaveLoading(true);
    try {
      const resultSlug = await savePlan(pin);
      if (resultSlug) {
        setSavedSlug(resultSlug);
        setSaveMode('done');
      }
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSaveAsNew = async () => {
    if (!pin.trim() || pin.length < 4) {
      setPinError('PIN must be at least 4 characters');
      return;
    }
    if (!newPlanName.trim()) {
      setPinError('Please enter a plan name');
      return;
    }
    setPinError('');
    setSaveLoading(true);
    try {
      // Create a new slug and update the plan name
      if (plan) {
        const newSlug = newPlanName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Math.random().toString(36).substring(2, 6);
        const newPlan = { ...plan, name: newPlanName.trim(), slug: newSlug, updatedAt: new Date().toISOString() };
        const plans = JSON.parse(localStorage.getItem('udel-plans') || '{}');
        plans[newSlug] = { ...newPlan, pin };
        localStorage.setItem('udel-plans', JSON.stringify(plans));
        setSavedSlug(newSlug);
        setSaveMode('done');
      }
    } finally {
      setSaveLoading(false);
    }
  };

  const shareUrl = savedSlug
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/plan/${savedSlug}`
    : null;

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // Loading state
  if (!initialLoadDone || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading your plan...</p>
      </div>
    );
  }

  // Error / not found state
  if (!plan && initialLoadDone) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4 px-4">
        <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center">
          <AlertCircle className="h-7 w-7 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Plan Not Found</h2>
        <p className="text-sm text-slate-500 text-center max-w-sm">
          We couldn&apos;t find a plan with slug{' '}
          <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-xs">
            {slug}
          </code>
          . It may have been removed or the link is incorrect.
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => router.push('/')}
            className="border-slate-200"
          >
            Go Home
          </Button>
          <Button
            onClick={() => router.push('/plan/new')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Create New Plan
          </Button>
        </div>
      </div>
    );
  }

  if (!plan) return null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top navigation bar */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-3 shrink-0 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <GraduationCap className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-bold text-slate-800 hidden sm:block">
            UDel Planner
          </span>
        </div>

        <Separator orientation="vertical" className="h-5 bg-slate-200" />

        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-slate-700 truncate">
            {plan.name}
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">
              Target: {plan.targetGraduation}
            </span>
            {plan.isEarlyGraduation && (
              <Badge className="text-[10px] bg-amber-100 text-amber-700 border-amber-200 border px-1.5 py-0 h-4">
                Early Grad
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Sidebar toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen((v) => !v)}
            className="h-8 px-2 text-slate-500 hover:text-slate-700"
            title={sidebarOpen ? 'Hide sidebar' : 'Show graduation tracker'}
          >
            {sidebarOpen ? (
              <PanelRightClose className="h-4 w-4" />
            ) : (
              <PanelRightOpen className="h-4 w-4" />
            )}
          </Button>

          {/* Save dialog */}
          <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
            <DialogTrigger
              className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors"
            >
              <Save className="h-3.5 w-3.5" />
              Save Plan
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-slate-800">
                  {savedSlug ? 'Plan Saved!' : 'Save Your Plan'}
                </DialogTitle>
              </DialogHeader>

              {!savedSlug ? (
                <div className="space-y-5 pt-2">
                  <p className="text-sm text-slate-500">
                    Set a PIN to protect your plan. You&apos;ll need it to
                    edit or share the plan later.
                  </p>

                  <div className="space-y-2">
                    <Label
                      htmlFor="save-pin"
                      className="text-sm font-semibold text-slate-700"
                    >
                      Plan PIN
                    </Label>
                    <Input
                      id="save-pin"
                      type="password"
                      value={pin}
                      onChange={(e) => {
                        setPin(e.target.value);
                        if (pinError) setPinError('');
                      }}
                      placeholder="Enter a PIN (min. 4 characters)"
                      className={cn(
                        'border-slate-200 focus:border-blue-300',
                        pinError && 'border-red-300'
                      )}
                      onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    />
                    {pinError && (
                      <p className="text-xs text-red-500">{pinError}</p>
                    )}
                  </div>

                  <Button
                    onClick={handleSave}
                    disabled={saveLoading || !pin.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {saveLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        Save Plan
                      </span>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-5 pt-2">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                    <CheckCheck className="h-5 w-5 text-emerald-500 shrink-0" />
                    <p className="text-sm text-emerald-700 font-medium">
                      Your plan has been saved successfully!
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">
                      Share Link
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={shareUrl || ''}
                        readOnly
                        className="text-xs text-slate-600 bg-slate-50 border-slate-200 h-9"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyLink}
                        className={cn(
                          'shrink-0 h-9 border-slate-200 transition-all duration-150',
                          copySuccess && 'border-emerald-300 text-emerald-600 bg-emerald-50'
                        )}
                      >
                        {copySuccess ? (
                          <CheckCheck className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Share this link with your advisor or keep it for reference
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => setSaveDialogOpen(false)}
                    className="w-full border-slate-200"
                  >
                    Close
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Plan grid area */}
        <main className="flex-1 overflow-hidden flex flex-col min-w-0">
          <PlanGrid
            plan={plan}
            onAddCourse={handleAddCourse}
            onRemoveCourse={handleRemoveCourse}
          />
        </main>

        {/* Graduation tracker sidebar */}
        <aside
          className={cn(
            'shrink-0 border-l border-slate-200 bg-white overflow-y-auto transition-all duration-200',
            sidebarOpen ? 'w-72' : 'w-0 overflow-hidden border-0'
          )}
        >
          {sidebarOpen && (
            <div className="p-4 h-full">
              <GraduationTracker plan={plan} />
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
