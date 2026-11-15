-- Register Tapco as the first tenant for the ordering API.
insert into public.restaurants (name, slug, phone, address)
values ('Tapco Pizza', 'tapco-pizza', '070-760 66 65', 'Klostergatan 14A, 633 52 Eskilstuna')
on conflict (slug) do nothing;
