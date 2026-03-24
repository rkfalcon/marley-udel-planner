import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    // Parse plan data from description field
    let planData = null;
    try {
      planData = data.description ? JSON.parse(data.description) : null;
    } catch {
      planData = null;
    }

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
    // Updating — verify PIN
    if (existing.pin_hash && existing.pin_hash !== pin) {
      return NextResponse.json({ error: 'WRONG_PIN' }, { status: 403 });
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
    pin_hash: pin || null,
    description: JSON.stringify({ ...plan, slug }),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ slug, action: 'created' });
}
