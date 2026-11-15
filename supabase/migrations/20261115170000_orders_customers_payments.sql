-- Orders, customers and payment records
-- Apply after 20261115160000_initial_platform_schema.sql.

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text,
  email text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, id)
);

create index customers_restaurant_created_idx
  on public.customers(restaurant_id, created_at desc);
create index customers_restaurant_email_idx
  on public.customers(restaurant_id, lower(email))
  where email is not null;
create index customers_restaurant_phone_idx
  on public.customers(restaurant_id, phone)
  where phone is not null;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  customer_id uuid,
  order_number text not null,
  status text not null default 'new'
    check (status in ('new', 'accepted', 'preparing', 'ready', 'completed', 'rejected', 'cancelled')),
  order_type text not null default 'pickup'
    check (order_type in ('pickup', 'delivery', 'dine_in')),
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'failed', 'refunded', 'partially_refunded')),
  customer_name text,
  customer_email text,
  customer_phone text,
  delivery_address text,
  special_instructions text,
  subtotal numeric(10,2) not null default 0 check (subtotal >= 0),
  discount_amount numeric(10,2) not null default 0 check (discount_amount >= 0),
  total numeric(10,2) not null default 0 check (total >= 0),
  currency text not null default 'SEK' check (char_length(currency) = 3),
  requested_for timestamptz,
  accepted_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, id),
  unique (restaurant_id, order_number),
  foreign key (restaurant_id, customer_id)
    references public.customers(restaurant_id, id)
    on delete restrict
);

create index orders_restaurant_created_idx
  on public.orders(restaurant_id, created_at desc);
create index orders_restaurant_status_idx
  on public.orders(restaurant_id, status, created_at desc);
create index orders_customer_idx
  on public.orders(customer_id, created_at desc);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null,
  order_id uuid not null,
  product_id uuid,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10,2) not null check (unit_price >= 0),
  selected_options jsonb not null default '[]'::jsonb,
  removed_ingredients jsonb not null default '[]'::jsonb,
  special_instructions text,
  line_total numeric(10,2) not null check (line_total >= 0),
  created_at timestamptz not null default now(),
  foreign key (restaurant_id, order_id)
    references public.orders(restaurant_id, id) on delete cascade,
  foreign key (restaurant_id, product_id)
    references public.products(restaurant_id, id) on delete restrict
);

create index order_items_order_idx on public.order_items(order_id);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null,
  order_id uuid not null,
  provider text not null,
  provider_payment_id text,
  amount numeric(10,2) not null check (amount >= 0),
  currency text not null default 'SEK' check (char_length(currency) = 3),
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded', 'partially_refunded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (restaurant_id, order_id)
    references public.orders(restaurant_id, id) on delete cascade
);

create index payments_order_idx on public.payments(order_id);
create index payments_provider_reference_idx
  on public.payments(provider, provider_payment_id)
  where provider_payment_id is not null;

alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;

-- Staff can read customer and order information only for their own restaurant.
create policy "members can read customers"
on public.customers for select to authenticated
using (public.is_restaurant_member(restaurant_id));

create policy "members can read orders"
on public.orders for select to authenticated
using (public.is_restaurant_member(restaurant_id));

create policy "members can update orders"
on public.orders for update to authenticated
using (public.is_restaurant_member(restaurant_id))
with check (public.is_restaurant_member(restaurant_id));

create policy "members can read order items"
on public.order_items for select to authenticated
using (public.is_restaurant_member(restaurant_id));

create policy "members can read payments"
on public.payments for select to authenticated
using (public.is_restaurant_member(restaurant_id));

-- Customer checkout and payment writes will go through trusted server routes.
-- No anonymous table-write policies are created here.
