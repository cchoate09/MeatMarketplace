create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  role text not null check (role in ('customer', 'farmer')),
  location_label text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.customer_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  saved_address jsonb not null default '{}'::jsonb,
  processor_customer_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.farms (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null unique references public.profiles(id) on delete cascade,
  farm_name text not null,
  story text not null default '',
  practices text[] not null default '{}',
  certifications text[] not null default '{}',
  contact_email text not null default '',
  contact_phone text not null default '',
  pickup_address text not null default '',
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.farmer_onboarding (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  legal_name text not null default '',
  identity_verified boolean not null default false,
  payout_account_label text not null default '',
  payout_ready boolean not null default false,
  connected_account_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.payment_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  account_type text not null check (account_type in ('customer', 'payout')),
  provider text not null default 'stripe',
  brand text,
  last4 text,
  expiry text,
  is_default boolean not null default false,
  processor_reference text,
  created_at timestamptz not null default now()
);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid references public.farms(id) on delete set null,
  farmer_id uuid not null references public.profiles(id) on delete cascade,
  farmer_name text not null,
  title text not null,
  description text not null,
  category text not null,
  cut text not null,
  price numeric(10,2) not null check (price > 0),
  unit text not null default 'lb',
  quantity_available integer not null check (quantity_available >= 0),
  low_stock_threshold integer not null check (low_stock_threshold >= 1),
  pickup_available boolean not null default true,
  shipping_available boolean not null default false,
  shipping_fee numeric(10,2) not null default 0 check (shipping_fee >= 0),
  location_name text not null default '',
  distance_miles numeric(10,2) not null default 0,
  available_on date not null,
  processing_days integer not null default 0 check (processing_days >= 0),
  pickup_instructions text not null default '',
  shipping_regions text[] not null default '{}',
  minimum_order integer,
  image_label text not null default '',
  breed text not null default '',
  packaging_details text not null default '',
  storage_details text not null default '',
  cooking_tip text not null default '',
  tags text[] not null default '{}',
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  label text,
  storage_path text,
  public_url text,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.pickup_slots (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  label text not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete restrict,
  listing_title text not null,
  farmer_id uuid not null references public.profiles(id) on delete restrict,
  farmer_name text not null,
  customer_id uuid not null references public.profiles(id) on delete restrict,
  customer_name text not null,
  quantity integer not null check (quantity > 0),
  delivery_method text not null check (delivery_method in ('pickup', 'shipping')),
  pickup_slot_id uuid references public.pickup_slots(id) on delete set null,
  pickup_slot_label text,
  payment_method_label text not null,
  payment_intent_id text,
  subtotal numeric(10,2) not null check (subtotal >= 0),
  shipping_fee numeric(10,2) not null check (shipping_fee >= 0),
  total_price numeric(10,2) not null check (total_price >= 0),
  status text not null check (status in ('new', 'confirmed', 'ready', 'picked_up', 'shipped', 'delivered')),
  created_at timestamptz not null default now()
);

create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null,
  changed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  customer_id uuid references public.profiles(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  customer_name text not null,
  rating integer not null check (rating between 1 and 5),
  comment text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists reviews_order_id_unique
on public.reviews(order_id)
where order_id is not null;

create table if not exists public.favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.create_order_with_inventory(
  p_listing_id uuid,
  p_listing_title text,
  p_farmer_id uuid,
  p_farmer_name text,
  p_customer_id uuid,
  p_customer_name text,
  p_quantity integer,
  p_delivery_method text,
  p_pickup_slot_id uuid,
  p_pickup_slot_label text,
  p_payment_method_label text,
  p_payment_intent_id text,
  p_subtotal numeric,
  p_shipping_fee numeric,
  p_total_price numeric
)
returns public.orders
language plpgsql
security definer
as $$
declare
  v_listing public.listings;
  v_order public.orders;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if auth.uid() <> p_customer_id then
    raise exception 'Customer mismatch';
  end if;

  select * into v_listing from public.listings where id = p_listing_id for update;

  if not found then
    raise exception 'Listing not found';
  end if;

  if v_listing.farmer_id <> p_farmer_id then
    raise exception 'Farmer mismatch';
  end if;

  if not v_listing.is_published then
    raise exception 'Listing is not available';
  end if;

  if v_listing.quantity_available < p_quantity then
    raise exception 'Insufficient inventory';
  end if;

  if v_listing.minimum_order is not null and p_quantity < v_listing.minimum_order then
    raise exception 'Order does not meet minimum quantity';
  end if;

  if p_delivery_method = 'pickup' and not v_listing.pickup_available then
    raise exception 'Pickup is not available for this listing';
  end if;

  if p_delivery_method = 'shipping' and not v_listing.shipping_available then
    raise exception 'Shipping is not available for this listing';
  end if;

  if p_delivery_method = 'pickup' then
    if p_pickup_slot_id is null then
      raise exception 'Pickup slot is required';
    end if;

    if not exists (
      select 1
      from public.pickup_slots
      where id = p_pickup_slot_id
        and listing_id = p_listing_id
    ) then
      raise exception 'Invalid pickup slot';
    end if;
  end if;

  if p_delivery_method = 'shipping' then
    p_pickup_slot_id := null;
    p_pickup_slot_label := null;
  end if;

  update public.listings
  set quantity_available = quantity_available - p_quantity
  where id = p_listing_id;

  insert into public.orders (
    listing_id,
    listing_title,
    farmer_id,
    farmer_name,
    customer_id,
    customer_name,
    quantity,
    delivery_method,
    pickup_slot_id,
    pickup_slot_label,
    payment_method_label,
    payment_intent_id,
    subtotal,
    shipping_fee,
    total_price,
    status
  ) values (
    p_listing_id,
    p_listing_title,
    p_farmer_id,
    p_farmer_name,
    p_customer_id,
    p_customer_name,
    p_quantity,
    p_delivery_method,
    p_pickup_slot_id,
    p_pickup_slot_label,
    p_payment_method_label,
    p_payment_intent_id,
    p_subtotal,
    p_shipping_fee,
    p_total_price,
    'new'
  )
  returning * into v_order;

  insert into public.order_status_history (order_id, status, changed_by)
  values (v_order.id, 'new', p_customer_id);

  insert into public.notifications (user_id, title, body)
  values
    (p_customer_id, 'Order placed', p_listing_title || ' has been placed.'),
    (p_farmer_id, 'New order received', p_customer_name || ' ordered ' || p_listing_title || '.');

  return v_order;
end;
$$;

create or replace function public.advance_order_status(
  p_order_id uuid,
  p_new_status text
)
returns void
language plpgsql
security definer
as $$
declare
  v_order public.orders;
  v_allowed boolean := false;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;

  if not found then
    raise exception 'Order not found';
  end if;

  if auth.uid() <> v_order.farmer_id then
    raise exception 'Only the farmer for this order can update its status';
  end if;

  v_allowed :=
    (v_order.status = 'new' and p_new_status = 'confirmed') or
    (v_order.status = 'confirmed' and p_new_status = 'ready') or
    (v_order.status = 'ready' and p_new_status in ('picked_up', 'shipped')) or
    (v_order.status in ('picked_up', 'shipped') and p_new_status = 'delivered');

  if not v_allowed then
    raise exception 'Invalid order status transition';
  end if;

  update public.orders set status = p_new_status where id = p_order_id;
  insert into public.order_status_history (order_id, status, changed_by) values (p_order_id, p_new_status, auth.uid());
  insert into public.notifications (user_id, title, body)
  values (v_order.customer_id, 'Order update', v_order.listing_title || ' is now ' || replace(p_new_status, '_', ' ') || '.');
end;
$$;

alter table public.profiles enable row level security;
alter table public.customer_profiles enable row level security;
alter table public.farms enable row level security;
alter table public.farmer_onboarding enable row level security;
alter table public.payment_accounts enable row level security;
alter table public.listings enable row level security;
alter table public.listing_images enable row level security;
alter table public.pickup_slots enable row level security;
alter table public.orders enable row level security;
alter table public.order_status_history enable row level security;
alter table public.reviews enable row level security;
alter table public.favorites enable row level security;
alter table public.notifications enable row level security;

create policy "public can read published listings" on public.listings for select using (is_published = true);
create policy "public can read listing images" on public.listing_images for select using (true);
create policy "public can read pickup slots" on public.pickup_slots for select using (true);
create policy "public can read farms" on public.farms for select using (true);
create policy "public can read reviews" on public.reviews for select using (true);

create policy "users can read own profile" on public.profiles for select using (auth.uid() = id);
create policy "public can read farmer profiles" on public.profiles for select using (role = 'farmer');
create policy "users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "users can read own customer profile" on public.customer_profiles for select using (auth.uid() = user_id);
create policy "users can upsert own customer profile" on public.customer_profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "farmers can read own onboarding" on public.farmer_onboarding for select using (auth.uid() = user_id);
create policy "farmers can upsert own onboarding" on public.farmer_onboarding for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users can manage own payment accounts" on public.payment_accounts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "farmers can manage own farm" on public.farms for all using (auth.uid() = owner_user_id) with check (auth.uid() = owner_user_id);
create policy "farmers can manage own listings" on public.listings for all using (auth.uid() = farmer_id) with check (auth.uid() = farmer_id);
create policy "farmers can manage pickup slots on own listings" on public.pickup_slots for all using (
  exists (select 1 from public.listings where public.listings.id = pickup_slots.listing_id and public.listings.farmer_id = auth.uid())
) with check (
  exists (select 1 from public.listings where public.listings.id = pickup_slots.listing_id and public.listings.farmer_id = auth.uid())
);
create policy "users can read own orders" on public.orders for select using (auth.uid() = customer_id or auth.uid() = farmer_id);
create policy "users can insert own notifications" on public.notifications for insert with check (auth.uid() = user_id);
create policy "customers can manage own favorites" on public.favorites for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users can read own notifications" on public.notifications for select using (auth.uid() = user_id);
create policy "users can update own notifications" on public.notifications for update using (auth.uid() = user_id);
create policy "customers can create reviews for own orders" on public.reviews for insert with check (auth.uid() = customer_id);

insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do nothing;

create policy "public can read listing storage objects"
on storage.objects for select
using (bucket_id = 'listing-images');

create policy "farmers can upload listing storage objects"
on storage.objects for insert
with check (bucket_id = 'listing-images' and auth.role() = 'authenticated');

create policy "farmers can update listing storage objects"
on storage.objects for update
using (bucket_id = 'listing-images' and auth.role() = 'authenticated');
