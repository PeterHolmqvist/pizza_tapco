-- Secure, guest-accessible order tracking.
alter table public.orders
  add column if not exists customer_tracking_token_hash text,
  add column if not exists customer_tracking_expires_at timestamptz,
  add column if not exists estimated_ready_at timestamptz,
  add column if not exists ready_at timestamptz;

create unique index if not exists orders_customer_tracking_token_hash_idx
  on public.orders(customer_tracking_token_hash)
  where customer_tracking_token_hash is not null;
