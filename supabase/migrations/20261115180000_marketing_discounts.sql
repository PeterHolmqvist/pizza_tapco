-- Marketing preferences and discount management.
-- Apply after 20261115170000_orders_customers_payments.sql.

create table public.marketing_preferences (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null,
  customer_id uuid not null,
  channel text not null check (channel in ('email', 'sms')),
  is_subscribed boolean not null default false,
  consent_source text,
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  foreign key (restaurant_id, customer_id)
    references public.customers(restaurant_id, id) on delete cascade
);

-- Keep a history of consent changes instead of overwriting earlier choices.
create index marketing_preferences_customer_idx
  on public.marketing_preferences(restaurant_id, customer_id, channel, recorded_at desc);

create table public.discount_codes (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  code text not null,
  discount_type text not null check (discount_type in ('percentage', 'fixed_amount')),
  discount_value numeric(10,2) not null check (discount_value > 0),
  first_order_only boolean not null default false,
  max_redemptions integer check (max_redemptions is null or max_redemptions > 0),
  valid_from timestamptz,
  valid_until timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, id),
  unique (restaurant_id, code),
  check (discount_type <> 'percentage' or discount_value <= 100),
  check (valid_until is null or valid_from is null or valid_until > valid_from)
);

create table public.discount_redemptions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null,
  discount_code_id uuid not null,
  customer_id uuid not null,
  order_id uuid not null,
  discount_amount numeric(10,2) not null check (discount_amount >= 0),
  redeemed_at timestamptz not null default now(),
  foreign key (restaurant_id, discount_code_id)
    references public.discount_codes(restaurant_id, id) on delete restrict,
  foreign key (restaurant_id, customer_id)
    references public.customers(restaurant_id, id) on delete restrict,
  foreign key (restaurant_id, order_id)
    references public.orders(restaurant_id, id) on delete restrict,
  unique (discount_code_id, order_id),
  unique (discount_code_id, customer_id)
);

create index discount_codes_restaurant_active_idx
  on public.discount_codes(restaurant_id, is_active);
create index discount_redemptions_customer_idx
  on public.discount_redemptions(restaurant_id, customer_id, redeemed_at desc);
create index discount_redemptions_order_idx
  on public.discount_redemptions(order_id);

alter table public.marketing_preferences enable row level security;
alter table public.discount_codes enable row level security;
alter table public.discount_redemptions enable row level security;

-- Only managers can inspect customer marketing preferences.
create policy "managers can read marketing preferences"
on public.marketing_preferences for select to authenticated
using (public.can_manage_restaurant(restaurant_id));

-- Consent changes are written through trusted server routes.
-- No direct browser insert/update/delete policies are granted.

create policy "members can read discount codes"
on public.discount_codes for select to authenticated
using (public.is_restaurant_member(restaurant_id));

create policy "managers can manage discount codes"
on public.discount_codes for all to authenticated
using (public.can_manage_restaurant(restaurant_id))
with check (public.can_manage_restaurant(restaurant_id));

create policy "members can read discount redemptions"
on public.discount_redemptions for select to authenticated
using (public.is_restaurant_member(restaurant_id));

-- Redemptions are created by trusted server-side checkout/payment logic.
