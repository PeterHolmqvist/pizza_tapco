-- Finance reporting settings and immutable VAT snapshot per order.
create table if not exists public.restaurant_finance_settings (
  restaurant_id uuid primary key references public.restaurants(id) on delete cascade,
  organization_number text,
  legal_name text,
  vat_rate numeric(5,2) not null default 6.00 check (vat_rate >= 0 and vat_rate <= 100),
  timezone text not null default 'Europe/Stockholm',
  accountant_email text,
  updated_at timestamptz not null default now()
);

alter table public.restaurant_finance_settings enable row level security;
create policy "managers can read finance settings"
on public.restaurant_finance_settings for select to authenticated
using (public.can_manage_restaurant(restaurant_id));
create policy "managers can insert finance settings"
on public.restaurant_finance_settings for insert to authenticated
with check (public.can_manage_restaurant(restaurant_id));
create policy "managers can update finance settings"
on public.restaurant_finance_settings for update to authenticated
using (public.can_manage_restaurant(restaurant_id))
with check (public.can_manage_restaurant(restaurant_id));

alter table public.orders
  add column if not exists vat_rate numeric(5,2),
  add column if not exists vat_amount numeric(10,2);
