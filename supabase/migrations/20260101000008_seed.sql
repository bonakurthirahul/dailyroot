-- 0008: Minimal first-run seed data (only when the catalog is empty)
-- Safe to run repeatedly. Does not create auth users.

do $$
declare
  v_has_categories boolean;
  v_coffee uuid;
  v_tea uuid;
  v_dessert uuid;
begin
  select exists (select 1 from public.categories) into v_has_categories;
  if v_has_categories then
    return;
  end if;

  insert into public.categories (name, slug, description, sort_order)
  values ('Coffee', 'coffee', 'Espresso-based classics', 1)
  returning id into v_coffee;

  insert into public.categories (name, slug, description, sort_order)
  values ('Tea', 'tea', 'Brewed and spiced teas', 2)
  returning id into v_tea;

  insert into public.categories (name, slug, description, sort_order)
  values ('Desserts', 'desserts', 'Sweet finishes', 3)
  returning id into v_dessert;

  insert into public.menu_items
    (category_id, name, description, base_price, is_featured, tags, sort_order)
  values
    (v_coffee, 'Espresso', 'A concentrated shot pulled to order', 150, false, '{veg,hot}', 1),
    (v_coffee, 'Cafe Latte', 'Espresso with steamed milk', 210, true, '{veg,hot}', 2),
    (v_coffee, 'Cappuccino', 'Espresso with a thick milk foam', 220, false, '{veg,hot}', 3),
    (v_tea, 'Masala Chai', 'Spiced milk tea', 120, true, '{veg,hot}', 1),
    (v_tea, 'Green Tea', 'Light and refreshing', 110, false, '{veg,hot}', 2),
    (v_dessert, 'Classic Tiramisu', 'Coffee-soaked layers', 260, true, '{veg,cold}', 1),
    (v_dessert, 'Chocolate Brownie', 'Served warm', 180, false, '{veg}', 2);
end
$$;
