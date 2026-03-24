import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST() {
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Missing Supabase config' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    db: { schema: 'public' },
  });

  // Test if the table exists by trying to select from it
  const { error: testError } = await supabase.from('plans').select('id').limit(1);

  if (testError && testError.code === '42P01') {
    // Table doesn't exist — need to create it via SQL
    // Since we can't run DDL through the REST API, return instructions
    return NextResponse.json({
      status: 'table_missing',
      message: 'Please run the SQL below in your Supabase SQL Editor',
      sql: `CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  target_graduation TEXT,
  is_early_graduation BOOLEAN DEFAULT false,
  pin_hash TEXT,
  plan_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Plans are publicly readable" ON plans FOR SELECT USING (true);
CREATE POLICY "Anyone can create plans" ON plans FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update plans" ON plans FOR UPDATE USING (true);

CREATE INDEX IF NOT EXISTS idx_plans_slug ON plans(slug);`
    });
  }

  if (testError) {
    return NextResponse.json({ status: 'error', error: testError.message });
  }

  return NextResponse.json({ status: 'ok', message: 'Table exists and is accessible' });
}
