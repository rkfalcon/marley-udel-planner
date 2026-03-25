'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePlan } from '@/hooks/use-plan';
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Calendar,
  Clock,
  Plus,
  GraduationCap,
  AlertCircle,
} from 'lucide-react';

interface PlanSummary {
  id: string;
  name: string;
  slug: string;
  targetGraduation: string;
  isEarlyGraduation: boolean;
  createdAt: string;
  updatedAt: string;
}

function formatRelativeDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function formatCreatedDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function PlanCard({
  plan,
  onRename,
  onDelete,
}: {
  plan: PlanSummary;
  onRename: (plan: PlanSummary) => void;
  onDelete: (plan: PlanSummary) => void;
}) {
  return (
    <Card className="h-full transition-all duration-200 border-slate-100 hover:border-blue-200 hover:shadow-md group relative">
      <Link href={`/plan/${plan.slug}`} className="block">
        <CardHeader className="pb-2 pt-4 px-4 pr-10">
          <div className="flex items-start gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-blue-600" />
              </div>
              <CardTitle className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2">
                {plan.name}
              </CardTitle>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-4 pb-4 space-y-2.5">
          <div className="flex items-center gap-1.5 text-sm text-slate-600">
            <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Grad: </span>
            <span className="font-medium">{plan.targetGraduation}</span>
            {plan.isEarlyGraduation && (
              <Badge className="ml-1 text-xs bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 px-1.5 py-0">
                Early
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Calendar className="w-3 h-3 shrink-0" />
            <span>Created {formatCreatedDate(plan.createdAt)}</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Clock className="w-3 h-3 shrink-0" />
            <span>Updated {formatRelativeDate(plan.updatedAt)}</span>
          </div>
        </CardContent>
      </Link>

      {/* Actions dropdown */}
      <div className="absolute top-3 right-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
            <MoreVertical className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem
              onClick={(e) => { e.preventDefault(); onRename(plan); }}
              className="cursor-pointer"
            >
              <Pencil className="h-3.5 w-3.5 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => { e.preventDefault(); onDelete(plan); }}
              className="cursor-pointer text-red-600 focus:text-red-600"
            >
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
}

function CreateNewPlanCard() {
  return (
    <Link href="/plan/new" className="group block">
      <Card className="h-full border-2 border-dashed border-slate-200 bg-slate-50/50 transition-all duration-200 hover:border-blue-300 hover:bg-blue-50/30 hover:shadow-sm group-hover:-translate-y-0.5">
        <CardContent className="flex flex-col items-center justify-center h-full min-h-[140px] gap-3 p-4">
          <div className="w-10 h-10 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center transition-colors group-hover:border-blue-300 group-hover:bg-blue-50">
            <Plus className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-600 group-hover:text-blue-600 transition-colors">
              Create New Plan
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Map out your path to graduation
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function PlanCardSkeleton() {
  return (
    <Card className="h-full border-slate-100 animate-pulse">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-100" />
          <div className="h-4 bg-slate-100 rounded w-3/4" />
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-2.5">
        <div className="h-3.5 bg-slate-100 rounded w-1/2" />
        <div className="h-3 bg-slate-100 rounded w-1/3" />
      </CardContent>
    </Card>
  );
}

export function PlansList() {
  const { getAllPlans } = usePlan();
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [dialogMode, setDialogMode] = useState<'rename' | 'delete' | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanSummary | null>(null);
  const [pin, setPin] = useState('');
  const [newName, setNewName] = useState('');
  const [pinError, setPinError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getAllPlans().then((result) => {
      if (!cancelled) {
        setPlans(result as PlanSummary[]);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [getAllPlans]);

  const openRename = (plan: PlanSummary) => {
    setSelectedPlan(plan);
    setNewName(plan.name);
    setPin('');
    setPinError('');
    setDialogMode('rename');
  };

  const openDelete = (plan: PlanSummary) => {
    setSelectedPlan(plan);
    setPin('');
    setPinError('');
    setDialogMode('delete');
  };

  const handleRename = async () => {
    if (!selectedPlan || !newName.trim()) return;
    setActionLoading(true);
    setPinError('');

    try {
      const res = await fetch('/api/plans', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: selectedPlan.slug, pin: pin || undefined, newName: newName.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'WRONG_PIN') {
          setPinError('Incorrect PIN. Please enter the PIN used when creating this plan.');
          setActionLoading(false);
          return;
        }
        throw new Error(data.error);
      }

      // Update local state
      setPlans(prev => prev.map(p =>
        p.slug === selectedPlan.slug ? { ...p, name: newName.trim() } : p
      ));
      setDialogMode(null);
    } catch (err) {
      setPinError(err instanceof Error ? err.message : 'Failed to rename');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPlan) return;
    setActionLoading(true);
    setPinError('');

    try {
      const res = await fetch(`/api/plans?slug=${encodeURIComponent(selectedPlan.slug)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pin || undefined }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'WRONG_PIN') {
          setPinError('Incorrect PIN. Please enter the PIN used when creating this plan.');
          setActionLoading(false);
          return;
        }
        throw new Error(data.error);
      }

      // Remove from local state
      setPlans(prev => prev.filter(p => p.slug !== selectedPlan.slug));
      setDialogMode(null);
    } catch (err) {
      setPinError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <PlanCardSkeleton />
        <PlanCardSkeleton />
        <CreateNewPlanCard />
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {plans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} onRename={openRename} onDelete={openDelete} />
        ))}
        <CreateNewPlanCard />
      </div>

      {/* Rename Dialog */}
      <Dialog open={dialogMode === 'rename'} onOpenChange={(open) => { if (!open) setDialogMode(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-800">
              Rename Plan
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">New Name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter new plan name"
                className="border-slate-200"
                onKeyDown={(e) => e.key === 'Enter' && handleRename()}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Plan PIN</Label>
              <Input
                type="password"
                value={pin}
                onChange={(e) => { setPin(e.target.value); setPinError(''); }}
                placeholder="Enter your plan PIN"
                className={cn('border-slate-200', pinError && 'border-red-300')}
                onKeyDown={(e) => e.key === 'Enter' && handleRename()}
              />
              {pinError && <p className="text-xs text-red-500">{pinError}</p>}
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setDialogMode(null)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={handleRename}
                disabled={actionLoading || !newName.trim()}
              >
                {actionLoading ? 'Renaming...' : 'Rename'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={dialogMode === 'delete'} onOpenChange={(open) => { if (!open) setDialogMode(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Delete Plan
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="p-3 rounded-lg bg-red-50 border border-red-100">
              <p className="text-sm text-red-700">
                Are you sure you want to permanently delete <strong>{selectedPlan?.name}</strong>?
                This action cannot be undone.
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Plan PIN</Label>
              <Input
                type="password"
                value={pin}
                onChange={(e) => { setPin(e.target.value); setPinError(''); }}
                placeholder="Enter your plan PIN to confirm"
                className={cn('border-slate-200', pinError && 'border-red-300')}
                onKeyDown={(e) => e.key === 'Enter' && handleDelete()}
              />
              {pinError && <p className="text-xs text-red-500">{pinError}</p>}
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setDialogMode(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleDelete}
                disabled={actionLoading}
              >
                {actionLoading ? 'Deleting...' : 'Delete Plan'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
