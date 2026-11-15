-- Initial multi-tenant restaurant platform schema
-- Run through Supabase SQL Editor or keep in sync as a migration.

create extension if not exists pgcrypto;

create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  primary_color text,
  phone text,
  email text,
  address text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Authentication identities are managed by Supabase Auth.
-- This table grants an Auth user access to one or more restaurants.
create table public.restaurant_users (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'staff'
    check (role in ('owner', 'admin', 'manager', 'staff')),
  created_at timestamptz not null default now(),
  unique (restaurant_id, user_id)
);

create table public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, name),
  unique (restaurant_id, id)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  category_id uuid,
  name text not null,
  description text,
  image_url text,
  price numeric(10,2) not null check (price >= 0),
  is_available boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, id),
  foreign key (restaurant_id, category_id)
    references public.menu_categories(restaurant_id, id)
    on delete set null
);

create table public.product_options (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  description text,
  price numeric(10,2) not null default 0 check (price >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, id)
);

create table public.product_option_links (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  product_id uuid not null,
  option_id uuid not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (product_id, option_id),
  foreign key (restaurant_id, product_id)
    references public.products(restaurant_id, id) on delete cascade,
  foreign key (restaurant_id, option_id)
    references public.product_options(restaurant_id, id) on delete cascade
);

create index restaurant_users_user_id_idx on public.restaurant_users(user_id);
create index menu_categories_restaurant_sort_idx on public.menu_categories(restaurant_id, sort_order);
create index products_restaurant_category_sort_idx on public.products(restaurant_id, category_id, sort_order);
create index product_options_restaurant_idx on public.product_options(restaurant_id);
create index product_option_links_product_idx on public.product_option_links(product_id);

-- Helper functions avoid recursive RLS checks on restaurant_users.
create or replace function public.is_restaurant_member(target_restaurant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.restaurant_users ru
    where ru.restaurant_id = target_restaurant_id
      and ru.user_id = (select auth.uid())
  );
$$;

create or replace function public.can_manage_restaurant(target_restaurant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.restaurant_users ru
    where ru.restaurant_id = target_restaurant_id
      and ru.user_id = (select auth.uid())
      and ru.role in ('owner', 'admin', 'manager')
  );
$$;

revoke all on function public.is_restaurant_member(uuid) from public;
revoke all on function public.can_manage_restaurant(uuid) from public;
grant execute on function public.is_restaurant_member(uuid) to authenticated;
grant execute on function public.can_manage_restaurant(uuid) to authenticated;

alter table public.restaurants enable row level security;
alter table public.restaurant_users enable row level security;
alter table public.menu_categories enable row level security;
alter table public.products enable row level security;
alter table public.product_options enable row level security;
alter table public.product_option_links enable row level security;

-- Restaurant members can see their own restaurant. Membership is provisioned
-- by a trusted admin process or manually during initial setup.
create policy "members can read their restaurants"
on public.restaurants for select to authenticated
using (public.is_restaurant_member(id));

create policy "admins can update their restaurants"
on public.restaurants for update to authenticated
using (public.can_manage_restaurant(id))
with check (public.can_manage_restaurant(id));

create policy "users can read their own memberships"
on public.restaurant_users for select to authenticated
using (user_id = (select auth.uid()) or public.can_manage_restaurant(restaurant_id));

create policy "managers can add restaurant members"
on public.restaurant_users for insert to authenticated
with check (public.can_manage_restaurant(restaurant_id));

create policy "managers can update restaurant members"
on public.restaurant_users for update to authenticated
using (public.can_manage_restaurant(restaurant_id))
with check (public.can_manage_restaurant(restaurant_id));

create policy "managers can remove restaurant members"
on public.restaurant_users for delete to authenticated
using (public.can_manage_restaurant(restaurant_id));

create policy "members can read categories"
on public.menu_categories for select to authenticated
using (public.is_restaurant_member(restaurant_id));

create policy "managers can manage categories"
on public.menu_categories for all to authenticated
using (public.can_manage_restaurant(restaurant_id))
with check (public.can_manage_restaurant(restaurant_id));

create policy "members can read products"
on public.products for select to authenticated
using (public.is_restaurant_member(restaurant_id));

create policy "managers can manage products"
on public.products for all to authenticated
using (public.can_manage_restaurant(restaurant_id))
with check (public.can_manage_restaurant(restaurant_id));

create policy "members can read product options"
on public.product_options for select to authenticated
using (public.is_restaurant_member(restaurant_id));

create policy "managers can manage product options"
on public.product_options for all to authenticated
using (public.can_manage_restaurant(restaurant_id))
with check (public.can_manage_restaurant(restaurant_id));

create policy "members can read product option links"
on public.product_option_links for select to authenticated
using (public.is_restaurant_member(restaurant_id));

create policy "managers can manage product option links"
on public.product_option_links for all to authenticated
using (public.can_manage_restaurant(restaurant_id))
with check (public.can_manage_restaurant(restaurant_id));
