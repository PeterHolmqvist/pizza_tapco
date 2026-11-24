-- Stripe Checkout demo: keep unpaid online orders out of Kitchen.
alter table public.orders
  add column if not exists payment_method text not null default 'in_store'
    check (payment_method in ('in_store', 'online'));

create index if not exists orders_restaurant_payment_method_idx
  on public.orders(restaurant_id, payment_method, payment_status, created_at desc);
