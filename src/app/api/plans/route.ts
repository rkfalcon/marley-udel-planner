import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createAdminClient, isSupabaseAdminConfigured } from '@/lib/supabase/server';
import type { Plan } from '@/lib/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 64);
}

function generateSlug(name: string): string {
  const base = slugify(name);
  const suffix = Math.random().toString(36).slice(2, 7);
  return base ? `${base}-${suffix}` : `plan-${suffix}`;
}

// ─── POST /api/plans ──────────────────────────────────────────────────────────
// Body: { plan: Plan, pin?: string }
// Returns: { slug: string, id: string }

export async function POST(req: NextRequest) {
  let body: { plan: Plan; pin?: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { plan, pin } = body;

  if (!plan || !plan.name) {
    return NextResponse.json({ error: 'plan.name is required' }, { status: 400 });
  }

  // ── Supabase path ───────────────────────────────────────────────────────────
  if (isSupabaseAdminConfigured()) {
    const supabase = createAdminClient();

    // Hash PIN if provided
    let pinHash: string | null = null;
    if (pin && pin.trim().length > 0) {
      pinHash = await bcrypt.hash(pin.trim(), 10);
    }

    const slug = plan.slug || generateSlug(plan.name);
    const now = new Date().toISOString();

    // Insert plan row
    const { data: planRow, error: planError } = await supabase
      .from('plans')
      .insert({
        name: plan.name,
        description: plan.description ?? null,
        slug,
        target_graduation: plan.targetGraduation,
        is_early_graduation: plan.isEarlyGraduation ?? false,
        pin_hash: pinHash,
        created_at: now,
        updated_at: now,
      })
      .select('id, slug')
      .single();

    if (planError || !planRow) {
      console.error('[POST /api/plans] plan insert error:', planError);
      return NextResponse.json(
        { error: planError?.message ?? 'Failed to insert plan' },
        { status: 500 }
      );
    }

    const planId: string = planRow.id;

    // Insert semesters + courses
    for (const semester of plan.semesters ?? []) {
      const { data: semRow, error: semError } = await supabase
        .from('plan_semesters')
        .insert({
          plan_id: planId,
          term: semester.term,
          year: semester.year,
          school: semester.school,
          sort_order: semester.sortOrder,
        })
        .select('id')
        .single();

      if (semError || !semRow) {
        console.error('[POST /api/plans] semester insert error:', semError);
        // Don't abort — continue best-effort
        continue;
      }

      const semesterId: string = semRow.id;

      if (semester.courses && semester.courses.length > 0) {
        const courseRows = semester.courses.map((c) => ({
          plan_semester_id: semesterId,
          course_code: c.courseCode,
          title: c.title,
          school: c.school,
          credits: c.credits,
          status: c.status,
          grade: c.grade ?? null,
          fulfills_requirement_id: c.fulfillsRequirementId ?? null,
          notes: c.notes ?? null,
        }));

        const { error: coursesError } = await supabase
          .from('plan_courses')
          .insert(courseRows);

        if (coursesError) {
          console.error('[POST /api/plans] courses insert error:', coursesError);
        }
      }
    }

    return NextResponse.json({ slug: planRow.slug, id: planId }, { status: 201 });
  }

  // ── No-Supabase fallback (client handles persistence via localStorage) ──────
  const slug = plan.slug || generateSlug(plan.name);
  const id = `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  return NextResponse.json({ slug, id }, { status: 200 });
}

// ─── GET /api/plans ───────────────────────────────────────────────────────────
// Query params: ?slug=<slug>
// Returns: single plan object (if slug given) or array of plan summaries

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');

  if (!isSupabaseAdminConfigured()) {
    // Without a database, nothing to return — client uses localStorage
    return NextResponse.json(
      slug ? null : [],
      { status: 200 }
    );
  }

  const supabase = createAdminClient();

  // ── Single plan by slug ─────────────────────────────────────────────────────
  if (slug) {
    const { data: planRow, error: planError } = await supabase
      .from('plans')
      .select('id, name, description, slug, target_graduation, is_early_graduation, created_at, updated_at')
      .eq('slug', slug)
      .single();

    if (planError || !planRow) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Load semesters
    const { data: semesters, error: semError } = await supabase
      .from('plan_semesters')
      .select('id, term, year, school, sort_order')
      .eq('plan_id', planRow.id)
      .order('sort_order');

    if (semError) {
      console.error('[GET /api/plans] semesters fetch error:', semError);
      return NextResponse.json({ error: 'Failed to load semesters' }, { status: 500 });
    }

    // Load courses for all semesters
    const semesterIds = (semesters ?? []).map((s) => s.id);
    let courseRows: Array<{
      id: string;
      plan_semester_id: string;
      course_code: string;
      title: string;
      school: string;
      credits: number;
      status: string;
      grade: string | null;
      fulfills_requirement_id: string | null;
      notes: string | null;
    }> = [];

    if (semesterIds.length > 0) {
      const { data: courses, error: coursesError } = await supabase
        .from('plan_courses')
        .select('id, plan_semester_id, course_code, title, school, credits, status, grade, fulfills_requirement_id, notes')
        .in('plan_semester_id', semesterIds);

      if (coursesError) {
        console.error('[GET /api/plans] courses fetch error:', coursesError);
      } else {
        courseRows = courses ?? [];
      }
    }

    // Shape into Plan type
    const plan: Plan = {
      id: planRow.id,
      name: planRow.name,
      description: planRow.description ?? undefined,
      slug: planRow.slug,
      targetGraduation: planRow.target_graduation,
      isEarlyGraduation: planRow.is_early_graduation,
      createdAt: planRow.created_at,
      updatedAt: planRow.updated_at,
      semesters: (semesters ?? []).map((sem) => ({
        id: sem.id,
        planId: planRow.id,
        term: sem.term,
        year: sem.year,
        school: sem.school,
        sortOrder: sem.sort_order,
        courses: courseRows
          .filter((c) => c.plan_semester_id === sem.id)
          .map((c) => ({
            id: c.id,
            planSemesterId: c.plan_semester_id,
            courseCode: c.course_code,
            title: c.title,
            school: c.school as 'udel' | 'brookdale',
            credits: c.credits,
            status: c.status as Plan['semesters'][0]['courses'][0]['status'],
            grade: c.grade ?? undefined,
            fulfillsRequirementId: c.fulfills_requirement_id ?? undefined,
            notes: c.notes ?? undefined,
          })),
      })),
    };

    return NextResponse.json(plan);
  }

  // ── List all plans (summary only, no semesters/courses) ─────────────────────
  const { data: planRows, error: listError } = await supabase
    .from('plans')
    .select('id, name, description, slug, target_graduation, is_early_graduation, created_at, updated_at')
    .order('updated_at', { ascending: false });

  if (listError) {
    console.error('[GET /api/plans] list error:', listError);
    return NextResponse.json({ error: 'Failed to list plans' }, { status: 500 });
  }

  const list = (planRows ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description ?? undefined,
    slug: p.slug,
    targetGraduation: p.target_graduation,
    isEarlyGraduation: p.is_early_graduation,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    semesters: [],
  }));

  return NextResponse.json(list);
}
