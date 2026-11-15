-- Move Tapco menu and configurable prices into the database.
alter table public.products add column if not exists catalog_key text;
alter table public.products add column if not exists price_small numeric(10,2);
alter table public.products add column if not exists price_medium numeric(10,2);
alter table public.products add column if not exists price_large numeric(10,2);
alter table public.products add column if not exists ingredients jsonb not null default '[]'::jsonb;
create unique index if not exists products_restaurant_catalog_key_uidx
  on public.products(restaurant_id, catalog_key) where catalog_key is not null;

alter table public.product_options add column if not exists option_key text;
alter table public.product_options add column if not exists option_type text not null default 'extra-ingredients'
  check (option_type in ('extra-ingredients','sauces','sides','drinks'));
create unique index if not exists product_options_restaurant_option_key_uidx
  on public.product_options(restaurant_id, option_key) where option_key is not null;

do $$
declare
  r_id uuid;
  cat_id uuid;
  p_id uuid;
  o_id uuid;
begin
  select id into r_id from public.restaurants where slug = 'tapco-pizza';
  if r_id is null then raise exception 'Tapco restaurant seed is missing'; end if;
  insert into public.menu_categories (restaurant_id, name, sort_order)
  values (r_id, 'Italienska Pizzor', 0)
  on conflict (restaurant_id, name) do update set is_active = true;
  insert into public.menu_categories (restaurant_id, name, sort_order)
  values (r_id, 'Amerikanska Pizzor', 1)
  on conflict (restaurant_id, name) do update set is_active = true;
  insert into public.menu_categories (restaurant_id, name, sort_order)
  values (r_id, 'Specialpizzor', 2)
  on conflict (restaurant_id, name) do update set is_active = true;
  select id into cat_id from public.menu_categories where restaurant_id = r_id and name = 'Italienska Pizzor';
  insert into public.products (restaurant_id, category_id, catalog_key, name, description, price, price_small, price_medium, price_large, ingredients, sort_order)
  values (r_id, cat_id, 'margarita', 'Margarita', 'Tomatsås, ost', 100, 100, 170, 280, '["Tomatsås","Ost"]'::jsonb, 0)
  on conflict (restaurant_id, catalog_key) where catalog_key is not null do update set
    category_id = excluded.category_id, name = excluded.name, description = excluded.description,
    price = excluded.price, price_small = excluded.price_small, price_medium = excluded.price_medium,
    price_large = excluded.price_large, ingredients = excluded.ingredients, sort_order = excluded.sort_order;
  select id into cat_id from public.menu_categories where restaurant_id = r_id and name = 'Italienska Pizzor';
  insert into public.products (restaurant_id, category_id, catalog_key, name, description, price, price_small, price_medium, price_large, ingredients, sort_order)
  values (r_id, cat_id, 'vesuvio', 'Vesuvio', 'Tomatsås, ost, skinka', 100, 100, 170, 280, '["Tomatsås","Ost","Skinka"]'::jsonb, 1)
  on conflict (restaurant_id, catalog_key) where catalog_key is not null do update set
    category_id = excluded.category_id, name = excluded.name, description = excluded.description,
    price = excluded.price, price_small = excluded.price_small, price_medium = excluded.price_medium,
    price_large = excluded.price_large, ingredients = excluded.ingredients, sort_order = excluded.sort_order;
  select id into cat_id from public.menu_categories where restaurant_id = r_id and name = 'Italienska Pizzor';
  insert into public.products (restaurant_id, category_id, catalog_key, name, description, price, price_small, price_medium, price_large, ingredients, sort_order)
  values (r_id, cat_id, 'capricciosa', 'Capricciosa', 'Tomatsås, ost, skinka, champinjoner', 100, 100, 170, 280, '["Tomatsås","Ost","Skinka","Champinjoner"]'::jsonb, 2)
  on conflict (restaurant_id, catalog_key) where catalog_key is not null do update set
    category_id = excluded.category_id, name = excluded.name, description = excluded.description,
    price = excluded.price, price_small = excluded.price_small, price_medium = excluded.price_medium,
    price_large = excluded.price_large, ingredients = excluded.ingredients, sort_order = excluded.sort_order;
  select id into cat_id from public.menu_categories where restaurant_id = r_id and name = 'Italienska Pizzor';
  insert into public.products (restaurant_id, category_id, catalog_key, name, description, price, price_small, price_medium, price_large, ingredients, sort_order)
  values (r_id, cat_id, 'hawaii', 'Hawaii', 'Tomatsås, ost, skinka, ananas', 100, 100, 170, 280, '["Tomatsås","Ost","Skinka","Ananas"]'::jsonb, 3)
  on conflict (restaurant_id, catalog_key) where catalog_key is not null do update set
    category_id = excluded.category_id, name = excluded.name, description = excluded.description,
    price = excluded.price, price_small = excluded.price_small, price_medium = excluded.price_medium,
    price_large = excluded.price_large, ingredients = excluded.ingredients, sort_order = excluded.sort_order;
  select id into cat_id from public.menu_categories where restaurant_id = r_id and name = 'Italienska Pizzor';
  insert into public.products (restaurant_id, category_id, catalog_key, name, description, price, price_small, price_medium, price_large, ingredients, sort_order)
  values (r_id, cat_id, 'al-funghi', 'Al Funghi', 'Tomatsås, ost, champinjoner', 100, 100, 170, 280, '["Tomatsås","Ost","Champinjoner"]'::jsonb, 4)
  on conflict (restaurant_id, catalog_key) where catalog_key is not null do update set
    category_id = excluded.category_id, name = excluded.name, description = excluded.description,
    price = excluded.price, price_small = excluded.price_small, price_medium = excluded.price_medium,
    price_large = excluded.price_large, ingredients = excluded.ingredients, sort_order = excluded.sort_order;
  select id into cat_id from public.menu_categories where restaurant_id = r_id and name = 'Italienska Pizzor';
  insert into public.products (restaurant_id, category_id, catalog_key, name, description, price, price_small, price_medium, price_large, ingredients, sort_order)
  values (r_id, cat_id, 'bolognese', 'Bolognese', 'Tomatsås, ost, köttfärs, lök', 100, 100, 170, 280, '["Tomatsås","Ost","Köttfärs","Lök"]'::jsonb, 5)
  on conflict (restaurant_id, catalog_key) where catalog_key is not null do update set
    category_id = excluded.category_id, name = excluded.name, description = excluded.description,
    price = excluded.price, price_small = excluded.price_small, price_medium = excluded.price_medium,
    price_large = excluded.price_large, ingredients = excluded.ingredients, sort_order = excluded.sort_order;
  select id into cat_id from public.menu_categories where restaurant_id = r_id and name = 'Italienska Pizzor';
  insert into public.products (restaurant_id, category_id, catalog_key, name, description, price, price_small, price_medium, price_large, ingredients, sort_order)
  values (r_id, cat_id, 'quattro-stagioni', 'Quattro Stagioni', 'Tomatsås, ost, skinka, champinjoner, räkor, musslor', 100, 100, 170, 280, '["Tomatsås","Ost","Skinka","Champinjoner","Räkor","Musslor"]'::jsonb, 6)
  on conflict (restaurant_id, catalog_key) where catalog_key is not null do update set
    category_id = excluded.category_id, name = excluded.name, description = excluded.description,
    price = excluded.price, price_small = excluded.price_small, price_medium = excluded.price_medium,
    price_large = excluded.price_large, ingredients = excluded.ingredients, sort_order = excluded.sort_order;
  select id into cat_id from public.menu_categories where restaurant_id = r_id and name = 'Italienska Pizzor';
  insert into public.products (restaurant_id, category_id, catalog_key, name, description, price, price_small, price_medium, price_large, ingredients, sort_order)
  values (r_id, cat_id, 'vegetariana', 'Vegetariana', 'Tomatsås, ost, paprika, lök, oliver, champinjoner', 100, 100, 170, 280, '["Tomatsås","Ost","Paprika","Lök","Oliver","Champinjoner"]'::jsonb, 7)
  on conflict (restaurant_id, catalog_key) where catalog_key is not null do update set
    category_id = excluded.category_id, name = excluded.name, description = excluded.description,
    price = excluded.price, price_small = excluded.price_small, price_medium = excluded.price_medium,
    price_large = excluded.price_large, ingredients = excluded.ingredients, sort_order = excluded.sort_order;
  select id into cat_id from public.menu_categories where restaurant_id = r_id and name = 'Italienska Pizzor';
  insert into public.products (restaurant_id, category_id, catalog_key, name, description, price, price_small, price_medium, price_large, ingredients, sort_order)
  values (r_id, cat_id, 'kebabpizza', 'Kebabpizza', 'Tomatsås, ost, kebabkött, lök, feferoni, vitlökssås', 100, 100, 170, 280, '["Tomatsås","Ost","Kebabkött","Lök","Feferoni","Vitlökssås"]'::jsonb, 8)
  on conflict (restaurant_id, catalog_key) where catalog_key is not null do update set
    category_id = excluded.category_id, name = excluded.name, description = excluded.description,
    price = excluded.price, price_small = excluded.price_small, price_medium = excluded.price_medium,
    price_large = excluded.price_large, ingredients = excluded.ingredients, sort_order = excluded.sort_order;
  select id into cat_id from public.menu_categories where restaurant_id = r_id and name = 'Italienska Pizzor';
  insert into public.products (restaurant_id, category_id, catalog_key, name, description, price, price_small, price_medium, price_large, ingredients, sort_order)
  values (r_id, cat_id, 'mexicana', 'Mexicana', 'Tomatsås, ost, köttfärs, jalapeño, lök', 100, 100, 170, 280, '["Tomatsås","Ost","Köttfärs","Jalapeño","Lök"]'::jsonb, 9)
  on conflict (restaurant_id, catalog_key) where catalog_key is not null do update set
    category_id = excluded.category_id, name = excluded.name, description = excluded.description,
    price = excluded.price, price_small = excluded.price_small, price_medium = excluded.price_medium,
    price_large = excluded.price_large, ingredients = excluded.ingredients, sort_order = excluded.sort_order;
  select id into cat_id from public.menu_categories where restaurant_id = r_id and name = 'Amerikanska Pizzor';
  insert into public.products (restaurant_id, category_id, catalog_key, name, description, price, price_small, price_medium, price_large, ingredients, sort_order)
  values (r_id, cat_id, 'americana', 'Americana', 'Tomatsås, ost, skinka, champinjoner', 120, 120, 190, 310, '["Tomatsås","Ost","Skinka","Champinjoner"]'::jsonb, 10)
  on conflict (restaurant_id, catalog_key) where catalog_key is not null do update set
    category_id = excluded.category_id, name = excluded.name, description = excluded.description,
    price = excluded.price, price_small = excluded.price_small, price_medium = excluded.price_medium,
    price_large = excluded.price_large, ingredients = excluded.ingredients, sort_order = excluded.sort_order;
  select id into cat_id from public.menu_categories where restaurant_id = r_id and name = 'Amerikanska Pizzor';
  insert into public.products (restaurant_id, category_id, catalog_key, name, description, price, price_small, price_medium, price_large, ingredients, sort_order)
  values (r_id, cat_id, 'pepperoni', 'Pepperoni', 'Tomatsås, ost, pepperoni', 120, 120, 190, 310, '["Tomatsås","Ost","Pepperoni"]'::jsonb, 11)
  on conflict (restaurant_id, catalog_key) where catalog_key is not null do update set
    category_id = excluded.category_id, name = excluded.name, description = excluded.description,
    price = excluded.price, price_small = excluded.price_small, price_medium = excluded.price_medium,
    price_large = excluded.price_large, ingredients = excluded.ingredients, sort_order = excluded.sort_order;
  select id into cat_id from public.menu_categories where restaurant_id = r_id and name = 'Amerikanska Pizzor';
  insert into public.products (restaurant_id, category_id, catalog_key, name, description, price, price_small, price_medium, price_large, ingredients, sort_order)
  values (r_id, cat_id, 'bbq-chicken', 'BBQ Chicken', 'Tomatsås, ost, kyckling, lök, BBQ-sås', 120, 120, 190, 310, '["Tomatsås","Ost","Kyckling","Lök","BBQ-sås"]'::jsonb, 12)
  on conflict (restaurant_id, catalog_key) where catalog_key is not null do update set
    category_id = excluded.category_id, name = excluded.name, description = excluded.description,
    price = excluded.price, price_small = excluded.price_small, price_medium = excluded.price_medium,
    price_large = excluded.price_large, ingredients = excluded.ingredients, sort_order = excluded.sort_order;
  select id into cat_id from public.menu_categories where restaurant_id = r_id and name = 'Amerikanska Pizzor';
  insert into public.products (restaurant_id, category_id, catalog_key, name, description, price, price_small, price_medium, price_large, ingredients, sort_order)
  values (r_id, cat_id, 'meat-lover', 'Meat Lover', 'Tomatsås, ost, skinka, bacon, köttfärs, pepperoni', 120, 120, 190, 310, '["Tomatsås","Ost","Skinka","Bacon","Köttfärs","Pepperoni"]'::jsonb, 13)
  on conflict (restaurant_id, catalog_key) where catalog_key is not null do update set
    category_id = excluded.category_id, name = excluded.name, description = excluded.description,
    price = excluded.price, price_small = excluded.price_small, price_medium = excluded.price_medium,
    price_large = excluded.price_large, ingredients = excluded.ingredients, sort_order = excluded.sort_order;
  select id into cat_id from public.menu_categories where restaurant_id = r_id and name = 'Amerikanska Pizzor';
  insert into public.products (restaurant_id, category_id, catalog_key, name, description, price, price_small, price_medium, price_large, ingredients, sort_order)
  values (r_id, cat_id, 'tex-mex', 'Tex Mex', 'Tomatsås, ost, köttfärs, jalapeño, paprika, vitlökssås', 120, 120, 190, 310, '["Tomatsås","Ost","Köttfärs","Jalapeño","Paprika","Vitlökssås"]'::jsonb, 14)
  on conflict (restaurant_id, catalog_key) where catalog_key is not null do update set
    category_id = excluded.category_id, name = excluded.name, description = excluded.description,
    price = excluded.price, price_small = excluded.price_small, price_medium = excluded.price_medium,
    price_large = excluded.price_large, ingredients = excluded.ingredients, sort_order = excluded.sort_order;
  select id into cat_id from public.menu_categories where restaurant_id = r_id and name = 'Amerikanska Pizzor';
  insert into public.products (restaurant_id, category_id, catalog_key, name, description, price, price_small, price_medium, price_large, ingredients, sort_order)
  values (r_id, cat_id, 'chicago', 'Chicago', 'Tomatsås, ost, bacon, lök, champinjoner', 120, 120, 190, 310, '["Tomatsås","Ost","Bacon","Lök","Champinjoner"]'::jsonb, 15)
  on conflict (restaurant_id, catalog_key) where catalog_key is not null do update set
    category_id = excluded.category_id, name = excluded.name, description = excluded.description,
    price = excluded.price, price_small = excluded.price_small, price_medium = excluded.price_medium,
    price_large = excluded.price_large, ingredients = excluded.ingredients, sort_order = excluded.sort_order;
  select id into cat_id from public.menu_categories where restaurant_id = r_id and name = 'Amerikanska Pizzor';
  insert into public.products (restaurant_id, category_id, catalog_key, name, description, price, price_small, price_medium, price_large, ingredients, sort_order)
  values (r_id, cat_id, 'new-york', 'New York', 'Tomatsås, ost, salami, paprika, lök', 120, 120, 190, 310, '["Tomatsås","Ost","Salami","Paprika","Lök"]'::jsonb, 16)
  on conflict (restaurant_id, catalog_key) where catalog_key is not null do update set
    category_id = excluded.category_id, name = excluded.name, description = excluded.description,
    price = excluded.price, price_small = excluded.price_small, price_medium = excluded.price_medium,
    price_large = excluded.price_large, ingredients = excluded.ingredients, sort_order = excluded.sort_order;
  select id into cat_id from public.menu_categories where restaurant_id = r_id and name = 'Amerikanska Pizzor';
  insert into public.products (restaurant_id, category_id, catalog_key, name, description, price, price_small, price_medium, price_large, ingredients, sort_order)
  values (r_id, cat_id, 'hawaii-american', 'Hawaii American', 'Tomatsås, ost, skinka, ananas, bacon', 120, 120, 190, 310, '["Tomatsås","Ost","Skinka","Ananas","Bacon"]'::jsonb, 17)
  on conflict (restaurant_id, catalog_key) where catalog_key is not null do update set
    category_id = excluded.category_id, name = excluded.name, description = excluded.description,
    price = excluded.price, price_small = excluded.price_small, price_medium = excluded.price_medium,
    price_large = excluded.price_large, ingredients = excluded.ingredients, sort_order = excluded.sort_order;
  select id into cat_id from public.menu_categories where restaurant_id = r_id and name = 'Amerikanska Pizzor';
  insert into public.products (restaurant_id, category_id, catalog_key, name, description, price, price_small, price_medium, price_large, ingredients, sort_order)
  values (r_id, cat_id, 'kebab-american', 'Kebab American', 'Tomatsås, ost, kebabkött, isbergssallad, tomat, lök, feferoni, vitlökssås', 120, 120, 190, 310, '["Tomatsås","Ost","Kebabkött","Isbergssallad","Tomat","Lök","Feferoni","Vitlökssås"]'::jsonb, 18)
  on conflict (restaurant_id, catalog_key) where catalog_key is not null do update set
    category_id = excluded.category_id, name = excluded.name, description = excluded.description,
    price = excluded.price, price_small = excluded.price_small, price_medium = excluded.price_medium,
    price_large = excluded.price_large, ingredients = excluded.ingredients, sort_order = excluded.sort_order;
  select id into cat_id from public.menu_categories where restaurant_id = r_id and name = 'Amerikanska Pizzor';
  insert into public.products (restaurant_id, category_id, catalog_key, name, description, price, price_small, price_medium, price_large, ingredients, sort_order)
  values (r_id, cat_id, 'tacopizza', 'Tacopizza', 'Tomatsås, ost, köttfärs, paprika, lök, tacosås, vitlökssås, jalapeño', 120, 120, 190, 310, '["Tomatsås","Ost","Köttfärs","Paprika","Lök","Tacosås","Vitlökssås","Jalapeño"]'::jsonb, 19)
  on conflict (restaurant_id, catalog_key) where catalog_key is not null do update set
    category_id = excluded.category_id, name = excluded.name, description = excluded.description,
    price = excluded.price, price_small = excluded.price_small, price_medium = excluded.price_medium,
    price_large = excluded.price_large, ingredients = excluded.ingredients, sort_order = excluded.sort_order;
  select id into cat_id from public.menu_categories where restaurant_id = r_id and name = 'Specialpizzor';
  insert into public.products (restaurant_id, category_id, catalog_key, name, description, price, price_small, price_medium, price_large, ingredients, sort_order)
  values (r_id, cat_id, 'oxfile-special', 'Oxfilé Special', 'Tomatsås, ost, oxfilé, champinjoner, paprika, lök, bearnaisesås', 145, 145, 230, 400, '["Tomatsås","Ost","Oxfilé","Champinjoner","Paprika","Lök","Bearnaisesås"]'::jsonb, 20)
  on conflict (restaurant_id, catalog_key) where catalog_key is not null do update set
    category_id = excluded.category_id, name = excluded.name, description = excluded.description,
    price = excluded.price, price_small = excluded.price_small, price_medium = excluded.price_medium,
    price_large = excluded.price_large, ingredients = excluded.ingredients, sort_order = excluded.sort_order;
  select id into cat_id from public.menu_categories where restaurant_id = r_id and name = 'Specialpizzor';
  insert into public.products (restaurant_id, category_id, catalog_key, name, description, price, price_small, price_medium, price_large, ingredients, sort_order)
  values (r_id, cat_id, 'gyros-special', 'Gyros Special', 'Tomatsås, ost, gyroskött, lök, tomat, feferoni, vitlökssås', 145, 145, 230, 400, '["Tomatsås","Ost","Gyroskött","Lök","Tomat","Feferoni","Vitlökssås"]'::jsonb, 21)
  on conflict (restaurant_id, catalog_key) where catalog_key is not null do update set
    category_id = excluded.category_id, name = excluded.name, description = excluded.description,
    price = excluded.price, price_small = excluded.price_small, price_medium = excluded.price_medium,
    price_large = excluded.price_large, ingredients = excluded.ingredients, sort_order = excluded.sort_order;
  select id into cat_id from public.menu_categories where restaurant_id = r_id and name = 'Specialpizzor';
  insert into public.products (restaurant_id, category_id, catalog_key, name, description, price, price_small, price_medium, price_large, ingredients, sort_order)
  values (r_id, cat_id, 'kyckling-special', 'Kyckling Special', 'Tomatsås, ost, kyckling, paprika, lök, bearnaisesås', 145, 145, 230, 400, '["Tomatsås","Ost","Kyckling","Paprika","Lök","Bearnaisesås"]'::jsonb, 22)
  on conflict (restaurant_id, catalog_key) where catalog_key is not null do update set
    category_id = excluded.category_id, name = excluded.name, description = excluded.description,
    price = excluded.price, price_small = excluded.price_small, price_medium = excluded.price_medium,
    price_large = excluded.price_large, ingredients = excluded.ingredients, sort_order = excluded.sort_order;
  select id into cat_id from public.menu_categories where restaurant_id = r_id and name = 'Specialpizzor';
  insert into public.products (restaurant_id, category_id, catalog_key, name, description, price, price_small, price_medium, price_large, ingredients, sort_order)
  values (r_id, cat_id, 'gorgonzola-special', 'Gorgonzola Special', 'Tomatsås, ost, skinka, champinjoner, gorgonzola, tomat', 145, 145, 230, 400, '["Tomatsås","Ost","Skinka","Champinjoner","Gorgonzola","Tomat"]'::jsonb, 23)
  on conflict (restaurant_id, catalog_key) where catalog_key is not null do update set
    category_id = excluded.category_id, name = excluded.name, description = excluded.description,
    price = excluded.price, price_small = excluded.price_small, price_medium = excluded.price_medium,
    price_large = excluded.price_large, ingredients = excluded.ingredients, sort_order = excluded.sort_order;
  select id into cat_id from public.menu_categories where restaurant_id = r_id and name = 'Specialpizzor';
  insert into public.products (restaurant_id, category_id, catalog_key, name, description, price, price_small, price_medium, price_large, ingredients, sort_order)
  values (r_id, cat_id, 'kebab-lyx', 'Kebab Lyx', 'Tomatsås, ost, kebabkött, champinjoner, lök, feferoni, bearnaisesås', 145, 145, 230, 400, '["Tomatsås","Ost","Kebabkött","Champinjoner","Lök","Feferoni","Bearnaisesås"]'::jsonb, 24)
  on conflict (restaurant_id, catalog_key) where catalog_key is not null do update set
    category_id = excluded.category_id, name = excluded.name, description = excluded.description,
    price = excluded.price, price_small = excluded.price_small, price_medium = excluded.price_medium,
    price_large = excluded.price_large, ingredients = excluded.ingredients, sort_order = excluded.sort_order;
  select id into cat_id from public.menu_categories where restaurant_id = r_id and name = 'Specialpizzor';
  insert into public.products (restaurant_id, category_id, catalog_key, name, description, price, price_small, price_medium, price_large, ingredients, sort_order)
  values (r_id, cat_id, 'tapco-special', 'Tapco Special', 'Tomatsås, ost, skinka, räkor, bacon, lök, paprika, bearnaisesås', 145, 145, 230, 400, '["Tomatsås","Ost","Skinka","Räkor","Bacon","Lök","Paprika","Bearnaisesås"]'::jsonb, 25)
  on conflict (restaurant_id, catalog_key) where catalog_key is not null do update set
    category_id = excluded.category_id, name = excluded.name, description = excluded.description,
    price = excluded.price, price_small = excluded.price_small, price_medium = excluded.price_medium,
    price_large = excluded.price_large, ingredients = excluded.ingredients, sort_order = excluded.sort_order;
  insert into public.product_options (restaurant_id, option_key, name, price, option_type, is_active)
  values (r_id, 'extra-cheese', 'Extra ost', 10, 'extra-ingredients', true)
  on conflict (restaurant_id, option_key) where option_key is not null do update set name = excluded.name, price = excluded.price, option_type = excluded.option_type, is_active = true;
  insert into public.product_options (restaurant_id, option_key, name, price, option_type, is_active)
  values (r_id, 'shrimp', 'Räkor', 25, 'extra-ingredients', true)
  on conflict (restaurant_id, option_key) where option_key is not null do update set name = excluded.name, price = excluded.price, option_type = excluded.option_type, is_active = true;
  insert into public.product_options (restaurant_id, option_key, name, price, option_type, is_active)
  values (r_id, 'bacon', 'Bacon', 15, 'extra-ingredients', true)
  on conflict (restaurant_id, option_key) where option_key is not null do update set name = excluded.name, price = excluded.price, option_type = excluded.option_type, is_active = true;
  insert into public.product_options (restaurant_id, option_key, name, price, option_type, is_active)
  values (r_id, 'mushrooms', 'Champinjoner', 10, 'extra-ingredients', true)
  on conflict (restaurant_id, option_key) where option_key is not null do update set name = excluded.name, price = excluded.price, option_type = excluded.option_type, is_active = true;
  insert into public.product_options (restaurant_id, option_key, name, price, option_type, is_active)
  values (r_id, 'bearnaise', 'Bearnaisesås', 15, 'sauces', true)
  on conflict (restaurant_id, option_key) where option_key is not null do update set name = excluded.name, price = excluded.price, option_type = excluded.option_type, is_active = true;
  insert into public.product_options (restaurant_id, option_key, name, price, option_type, is_active)
  values (r_id, 'garlic-sauce', 'Vitlökssås', 15, 'sauces', true)
  on conflict (restaurant_id, option_key) where option_key is not null do update set name = excluded.name, price = excluded.price, option_type = excluded.option_type, is_active = true;
  insert into public.product_options (restaurant_id, option_key, name, price, option_type, is_active)
  values (r_id, 'pizza-salad', 'Pizzasallad', 15, 'sides', true)
  on conflict (restaurant_id, option_key) where option_key is not null do update set name = excluded.name, price = excluded.price, option_type = excluded.option_type, is_active = true;
  insert into public.product_options (restaurant_id, option_key, name, price, option_type, is_active)
  values (r_id, 'soft-drink', 'Läsk', 25, 'drinks', true)
  on conflict (restaurant_id, option_key) where option_key is not null do update set name = excluded.name, price = excluded.price, option_type = excluded.option_type, is_active = true;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'margarita';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'extra-cheese';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'margarita';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'shrimp';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'margarita';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'mushrooms';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'margarita';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'bacon';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'margarita';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'bearnaise';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'margarita';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'garlic-sauce';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'margarita';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'pizza-salad';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'margarita';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'soft-drink';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'vesuvio';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'extra-cheese';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'vesuvio';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'shrimp';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'vesuvio';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'mushrooms';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'vesuvio';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'bacon';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'vesuvio';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'bearnaise';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'vesuvio';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'garlic-sauce';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'vesuvio';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'pizza-salad';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'vesuvio';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'soft-drink';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'capricciosa';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'extra-cheese';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'capricciosa';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'shrimp';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'capricciosa';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'mushrooms';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'capricciosa';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'bacon';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'capricciosa';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'bearnaise';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'capricciosa';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'garlic-sauce';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'capricciosa';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'pizza-salad';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'capricciosa';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'soft-drink';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'hawaii';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'extra-cheese';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'hawaii';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'shrimp';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'hawaii';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'mushrooms';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'hawaii';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'bacon';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'hawaii';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'bearnaise';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'hawaii';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'garlic-sauce';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'hawaii';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'pizza-salad';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'hawaii';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'soft-drink';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'al-funghi';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'bearnaise';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'al-funghi';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'garlic-sauce';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'al-funghi';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'pizza-salad';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'al-funghi';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'soft-drink';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'bolognese';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'bearnaise';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'bolognese';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'garlic-sauce';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'bolognese';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'pizza-salad';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'bolognese';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'soft-drink';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'quattro-stagioni';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'bearnaise';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'quattro-stagioni';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'garlic-sauce';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'quattro-stagioni';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'pizza-salad';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'quattro-stagioni';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'soft-drink';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'vegetariana';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'extra-cheese';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'vegetariana';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'mushrooms';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'vegetariana';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'bearnaise';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'vegetariana';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'garlic-sauce';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'vegetariana';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'pizza-salad';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'vegetariana';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'soft-drink';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'kebabpizza';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'extra-cheese';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'kebabpizza';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'bacon';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'kebabpizza';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'mushrooms';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'kebabpizza';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'bearnaise';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'kebabpizza';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'garlic-sauce';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'kebabpizza';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'pizza-salad';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'kebabpizza';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'soft-drink';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'mexicana';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'bearnaise';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'mexicana';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'garlic-sauce';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'mexicana';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'pizza-salad';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'mexicana';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'soft-drink';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'americana';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'bearnaise';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'americana';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'garlic-sauce';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'americana';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'pizza-salad';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'americana';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'soft-drink';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'pepperoni';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'bearnaise';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'pepperoni';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'garlic-sauce';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'pepperoni';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'pizza-salad';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'pepperoni';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'soft-drink';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'bbq-chicken';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'bearnaise';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'bbq-chicken';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'garlic-sauce';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'bbq-chicken';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'pizza-salad';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'bbq-chicken';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'soft-drink';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'meat-lover';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'bearnaise';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'meat-lover';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'garlic-sauce';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'meat-lover';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'pizza-salad';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'meat-lover';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'soft-drink';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'tex-mex';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'bearnaise';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'tex-mex';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'garlic-sauce';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'tex-mex';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'pizza-salad';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'tex-mex';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'soft-drink';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'chicago';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'bearnaise';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'chicago';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'garlic-sauce';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'chicago';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'pizza-salad';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'chicago';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'soft-drink';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'new-york';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'bearnaise';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'new-york';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'garlic-sauce';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'new-york';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'pizza-salad';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'new-york';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'soft-drink';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'hawaii-american';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'bearnaise';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'hawaii-american';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'garlic-sauce';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'hawaii-american';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'pizza-salad';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'hawaii-american';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'soft-drink';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'kebab-american';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'bearnaise';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'kebab-american';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'garlic-sauce';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'kebab-american';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'pizza-salad';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'kebab-american';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'soft-drink';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'tacopizza';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'bearnaise';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'tacopizza';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'garlic-sauce';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'tacopizza';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'pizza-salad';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'tacopizza';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'soft-drink';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'oxfile-special';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'bearnaise';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'oxfile-special';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'garlic-sauce';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'oxfile-special';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'pizza-salad';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'oxfile-special';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'soft-drink';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'gyros-special';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'bearnaise';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'gyros-special';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'garlic-sauce';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'gyros-special';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'pizza-salad';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'gyros-special';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'soft-drink';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'kyckling-special';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'bearnaise';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'kyckling-special';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'garlic-sauce';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'kyckling-special';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'pizza-salad';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'kyckling-special';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'soft-drink';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'gorgonzola-special';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'bearnaise';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'gorgonzola-special';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'garlic-sauce';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'gorgonzola-special';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'pizza-salad';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'gorgonzola-special';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'soft-drink';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'kebab-lyx';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'bearnaise';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'kebab-lyx';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'garlic-sauce';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'kebab-lyx';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'pizza-salad';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'kebab-lyx';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'soft-drink';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'tapco-special';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'bearnaise';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'tapco-special';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'garlic-sauce';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'tapco-special';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'pizza-salad';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
  select id into p_id from public.products where restaurant_id = r_id and catalog_key = 'tapco-special';
  select id into o_id from public.product_options where restaurant_id = r_id and option_key = 'soft-drink';
  insert into public.product_option_links (restaurant_id, product_id, option_id)
  values (r_id, p_id, o_id) on conflict (product_id, option_id) do nothing;
end $$;
