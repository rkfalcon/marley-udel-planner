import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// Force Node.js runtime (bcryptjs requires it)
export const runtime = 'nodejs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function getSupabase() {
  return createClient(supabaseUrl, serviceRoleKey);
}

// GET /api/plans?slug=xxx — get a single plan
// GET /api/plans — list all plans
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug');
  const supabase = getSupabase();

  if (slug) {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Parse plan data from description field (stores full plan as JSON)
    let planData = null;
    try {
      planData = data.description ? JSON.parse(data.description) : null;
    } catch {
      planData = null;
    }

    if (planData && planData.semesters) {
      // Full plan data found — return it with DB metadata
      return NextResponse.json({
        ...planData,
        id: data.id,
        slug: data.slug,
        name: data.name,
        targetGraduation: data.target_graduation,
        isEarlyGraduation: data.is_early_graduation,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      });
    }

    // Plan exists but no embedded JSON — try to reconstruct from legacy tables
    try {
      const { data: semesters } = await supabase
        .from('plan_semesters')
        .select('id, term, year, school, sort_order')
        .eq('plan_id', data.id)
        .order('sort_order');

      if (semesters && semesters.length > 0) {
        const semesterIds = semesters.map(s => s.id);
        const { data: courses } = await supabase
          .from('plan_courses')
          .select('id, plan_semester_id, course_code, title, school, credits, status, grade, notes')
          .in('plan_semester_id', semesterIds);

        const reconstructedPlan = {
          id: data.id,
          slug: data.slug,
          name: data.name,
          targetGraduation: data.target_graduation || 'Spring 2028',
          isEarlyGraduation: data.is_early_graduation || false,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          semesters: semesters.map(sem => ({
            id: sem.id,
            planId: data.id,
            term: sem.term,
            year: sem.year,
            school: sem.school,
            sortOrder: sem.sort_order,
            courses: (courses || [])
              .filter(c => c.plan_semester_id === sem.id)
              .map(c => ({
                id: c.id,
                planSemesterId: c.plan_semester_id,
                courseCode: c.course_code,
                title: c.title || '',
                school: c.school,
                credits: c.credits,
                status: c.status,
                grade: c.grade || undefined,
                notes: c.notes || undefined,
              })),
          })),
        };

        // Backfill: save the reconstructed plan into the description column
        // so future loads use the fast JSON path
        await supabase
          .from('plans')
          .update({ description: JSON.stringify(reconstructedPlan) })
          .eq('slug', data.slug);

        return NextResponse.json(reconstructedPlan);
      }
    } catch {
      // Legacy tables don't exist or query failed — fall through
    }

    // No legacy data either — return skeleton for client to rebuild
    return NextResponse.json({
      id: data.id,
      slug: data.slug,
      name: data.name,
      targetGraduation: data.target_graduation || 'Spring 2028',
      isEarlyGraduation: data.is_early_graduation || false,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      semesters: [],
      _legacy: true,
    });
  }

  // List all plans (summary only)
  const { data, error } = await supabase
    .from('plans')
    .select('id, slug, name, target_graduation, is_early_graduation, created_at, updated_at')
    .order('updated_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    (data || []).map(d => ({
      id: d.id,
      slug: d.slug,
      name: d.name,
      targetGraduation: d.target_graduation,
      isEarlyGraduation: d.is_early_graduation,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }))
  );
}

// POST /api/plans
// Body: { plan, pin, action: 'create' | 'update' | 'save_as_new' }
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { plan, pin, action = 'create' } = body;

  if (!plan || !plan.slug) {
    return NextResponse.json({ error: 'Plan data required' }, { status: 400 });
  }

  const supabase = getSupabase();

  // Check if plan already exists
  const { data: existing } = await supabase
    .from('plans')
    .select('id, pin_hash')
    .eq('slug', plan.slug)
    .single();

  if (existing && action === 'update') {
    // Updating — verify PIN (supports both bcrypt-hashed and plain text PINs)
    if (existing.pin_hash) {
      const isBcrypt = existing.pin_hash.startsWith('$2');
      const pinValid = isBcrypt
        ? await bcrypt.compare(pin || '', existing.pin_hash)
        : existing.pin_hash === pin;
      if (!pinValid) {
        return NextResponse.json({ error: 'WRONG_PIN' }, { status: 403 });
      }
    }

    // Update
    const { error } = await supabase
      .from('plans')
      .update({
        name: plan.name,
        target_graduation: plan.targetGraduation,
        is_early_graduation: plan.isEarlyGraduation || false,
        description: JSON.stringify(plan),
        updated_at: new Date().toISOString(),
      })
      .eq('slug', plan.slug);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ slug: plan.slug, action: 'updated' });
  }

  // Creating new plan (or save_as_new, or first save)
  const slug = action === 'save_as_new'
    ? plan.slug + '-' + Math.random().toString(36).substring(2, 5)
    : plan.slug;

  // Delete existing row if re-creating (first save of same slug)
  if (existing && action === 'create') {
    await supabase.from('plans').delete().eq('slug', plan.slug);
  }

  const { error } = await supabase.from('plans').insert({
    slug,
    name: plan.name,
    target_graduation: plan.targetGraduation,
    is_early_graduation: plan.isEarlyGraduation || false,
    pin_hash: pin ? await bcrypt.hash(pin, 10) : null,
    description: JSON.stringify({ ...plan, slug }),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ slug, action: 'created' });
}

// DELETE /api/plans?slug=xxx
// Body: { pin }
export async function DELETE(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug');
  if (!slug) {
    return NextResponse.json({ error: 'Slug required' }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const { pin } = body as { pin?: string };

  const supabase = getSupabase();

  const { data: existing } = await supabase
    .from('plans')
    .select('id, pin_hash')
    .eq('slug', slug)
    .single();

  if (!existing) {
    return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
  }

  // Verify PIN
  if (existing.pin_hash) {
    const isBcrypt = existing.pin_hash.startsWith('$2');
    const pinValid = isBcrypt
      ? await bcrypt.compare(pin || '', existing.pin_hash)
      : existing.pin_hash === pin;
    if (!pinValid) {
      return NextResponse.json({ error: 'WRONG_PIN' }, { status: 403 });
    }
  }

  // Delete legacy table data first
  const { data: semesters } = await supabase
    .from('plan_semesters')
    .select('id')
    .eq('plan_id', existing.id);

  if (semesters && semesters.length > 0) {
    const semIds = semesters.map(s => s.id);
    await supabase.from('plan_courses').delete().in('plan_semester_id', semIds);
    await supabase.from('plan_semesters').delete().eq('plan_id', existing.id);
  }

  // Delete the plan
  const { error } = await supabase.from('plans').delete().eq('slug', slug);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

// PATCH /api/plans
// Body: { slug, pin, newName }
export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { slug, pin, newName } = body as { slug: string; pin?: string; newName?: string };

  if (!slug) {
    return NextResponse.json({ error: 'Slug required' }, { status: 400 });
  }

  const supabase = getSupabase();

  const { data: existing } = await supabase
    .from('plans')
    .select('id, pin_hash, description')
    .eq('slug', slug)
    .single();

  if (!existing) {
    return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
  }

  // Verify PIN
  if (existing.pin_hash) {
    const isBcrypt = existing.pin_hash.startsWith('$2');
    const pinValid = isBcrypt
      ? await bcrypt.compare(pin || '', existing.pin_hash)
      : existing.pin_hash === pin;
    if (!pinValid) {
      return NextResponse.json({ error: 'WRONG_PIN' }, { status: 403 });
    }
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (newName) {
    updates.name = newName;
    // Also update the name inside the JSON description
    if (existing.description) {
      try {
        const planData = JSON.parse(existing.description);
        planData.name = newName;
        updates.description = JSON.stringify(planData);
      } catch {
        // ignore parse errors
      }
    }
  }

  const { error } = await supabase.from('plans').update(updates).eq('slug', slug);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true, slug });
}
