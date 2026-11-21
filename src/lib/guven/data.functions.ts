import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { z } from 'zod';

export const getPublicData = createServerFn({ method: 'GET' }).handler(async () => {
  const url = process.env['SUPABASE_URL']; const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
  if (!url || !key) return { businesses: [], alerts: [], cases: [], unavailable: true };
  const client = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => { const headers = new Headers(init?.headers); if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization'); headers.set('apikey', key); return fetch(input, { ...init, headers }); } } });
  try {
    const [businesses, alerts, cases] = await Promise.all([
      client.from('businesses').select('id,name,category,description,address,phone,email,website,working_hours,verification_status,trust_scores(*)').order('created_at', { ascending: false }).limit(60),
      client.from('alerts').select('id,title,body,level,created_at').eq('published', true).order('created_at', { ascending: false }).limit(12),
      client.from('similar_cases').select('id,title,category,method_summary,solution_hint,case_count').eq('published', true).limit(12),
    ]);
    return { businesses: businesses.data ?? [], alerts: alerts.data ?? [], cases: cases.data ?? [], unavailable: !!(businesses.error || alerts.error || cases.error) };
  } catch { return { businesses: [], alerts: [], cases: [], unavailable: true }; }
});
export const checkRisk = createServerFn({ method: 'POST' }).inputValidator(z.object({ type: z.enum(['phone','website','social','payment']), value: z.string().trim().min(3).max(200) })).handler(async ({ data }) => {
  const url = process.env['SUPABASE_URL']; const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
  if (!url || !key) throw new Error('Hizmete ulaşılamıyor.');
  const client = createClient<Database>(url, key, { auth: { persistSession: false }, global: { fetch: (input, init) => { const headers = new Headers(init?.headers); if (key.startsWith('sb_')) headers.delete('Authorization'); headers.set('apikey', key); return fetch(input, { ...init, headers }); } } });
  const result = await client.rpc('check_entity', { _type: data.type, _value: data.value });
  if (result.error) throw new Error('Risk sorgusu şu anda tamamlanamadı. Sonuç bulunamadığı anlamına gelmez.');
  if (!result.data?.length) throw new Error('Lütfen geçerli bir numara, adres veya hesap girin.');
  return result.data[0];
});
export const getWorkspace = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { supabase: client, userId } = context;
  const [reports, attachments, businesses, support, profile, roles, responses] = await Promise.all([
    client.from('reports').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    client.from('report_attachments').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    client.from('businesses').select('*').eq('owner_id', userId),
    client.from('support_requests').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    client.from('profiles').select('id,full_name,email').eq('id', userId).single(),
    client.from('user_roles').select('role').eq('user_id', userId),
    client.from('business_responses').select('*').not('report_id','is',null),
  ]);
  for (const result of [reports, attachments, businesses, support, profile, roles, responses]) if (result.error) throw new Error('Hesap verileri yüklenemedi. Lütfen tekrar deneyin.');
  return { reports: reports.data ?? [], attachments: attachments.data ?? [], businesses: businesses.data ?? [], support: support.data ?? [], profile: profile.data, roles: roles.data ?? [], responses: responses.data ?? [] };
});
export const getAdminData = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data: allowed, error } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
  if (error || !allowed) throw new Error('Bu alan yalnızca yöneticilere açıktır.');
  const [stats, reports, verifications, support, appeals, profiles, audit] = await Promise.all([
    context.supabase.rpc('admin_stats'), context.supabase.from('reports').select('*').order('created_at',{ ascending:false }).limit(100), context.supabase.from('business_verifications').select('*').limit(100), context.supabase.from('support_requests').select('*').limit(100), context.supabase.from('appeals').select('*').limit(100), context.supabase.from('profiles').select('*').limit(100), context.supabase.from('audit_logs').select('*').order('created_at',{ascending:false}).limit(50)
  ]);
  for (const result of [stats,reports,verifications,support,appeals,profiles,audit]) if (result.error) throw new Error('Yönetim verileri yüklenemedi.');
  return { stats: stats.data, reports: reports.data ?? [], verifications: verifications.data ?? [], support: support.data ?? [], appeals: appeals.data ?? [], profiles: profiles.data ?? [], audit: audit.data ?? [] };
});

export const getBusinessPage = createServerFn({ method: 'GET' }).inputValidator(z.object({ id: z.string().uuid() })).handler(async ({ data }) => {
  const url = process.env['SUPABASE_URL']; const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
  if (!url || !key) throw new Error('İşletme bilgilerine şu anda ulaşılamıyor.');
  const client = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => { const headers = new Headers(init?.headers); if (key.startsWith('sb_')) headers.delete('Authorization'); headers.set('apikey', key); return fetch(input, { ...init, headers }); } } });
  const [business, reviews, responses] = await Promise.all([
    client.from('businesses').select('id,name,category,description,address,phone,email,website,working_hours,verification_status,trust_scores(*)').eq('id', data.id).maybeSingle(),
    client.from('reviews').select('id,rating,title,body,is_verified_experience,created_at').eq('business_id', data.id).eq('is_hidden', false).order('created_at', { ascending: false }).limit(100),
    client.from('business_responses').select('id,review_id,body,created_at').eq('business_id', data.id).not('review_id','is',null),
  ]);
  if (business.error || reviews.error || responses.error) throw new Error('İşletme bilgilerine şu anda ulaşılamıyor.');
  return { business: business.data, reviews: reviews.data ?? [], responses: responses.data ?? [] };
});

export const getOwnedBusiness = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).inputValidator(z.object({ id: z.string().uuid() })).handler(async ({ data, context }) => {
  const { data: business, error } = await context.supabase.from('businesses').select('*').eq('id', data.id).eq('owner_id', context.userId).single();
  if (error || !business) throw new Error('İşletme bulunamadı veya yönetim yetkiniz yok.');
  const [verifications, reports, reviews, responses] = await Promise.all([
    context.supabase.from('business_verifications').select('*').eq('business_id', data.id),
    context.supabase.from('reports').select('id,title,description,status,created_at').eq('business_id', data.id),
    context.supabase.from('reviews').select('id,title,body,rating,created_at').eq('business_id', data.id),
    context.supabase.from('business_responses').select('*').eq('business_id', data.id),
  ]);
  for (const result of [verifications,reports,reviews,responses]) if (result.error) throw new Error('İşletme süreçleri yüklenemedi.');
  return { business, verifications:verifications.data??[], reports:reports.data??[], reviews:reviews.data??[], responses:responses.data??[] };
});
