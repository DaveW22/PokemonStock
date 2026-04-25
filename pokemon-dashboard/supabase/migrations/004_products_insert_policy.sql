drop policy if exists "public_insert_products" on public.products;
create policy "public_insert_products"
on public.products
for insert
to anon, authenticated
with check (true);

drop policy if exists "public_update_products" on public.products;
create policy "public_update_products"
on public.products
for update
to anon, authenticated
using (true)
with check (true);
