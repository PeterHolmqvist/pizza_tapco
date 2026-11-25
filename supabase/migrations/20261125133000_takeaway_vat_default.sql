-- Swedish takeaway food is normally taxed at 6% from 1 April 2026.
-- Restaurant services with on-premises dining remain 12%; this app currently
-- accepts pickup and delivery orders only.
alter table public.restaurant_finance_settings
  alter column vat_rate set default 6.00;
