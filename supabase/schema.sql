-- Run this in the Supabase SQL editor for the OfferTCG backend.

create table if not exists public.current_deals (
  user_id uuid primary key references auth.users(id) on delete cascade,
  cart jsonb not null default '[]'::jsonb,
  global_buy_percent integer not null default 70,
  imported_local_data boolean not null default false,
  updated_at timestamptz not null default now()
);
create table if not exists public.deal_lots (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  checked_out_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (id, user_id)
);

create table if not exists public.deal_lot_items (
  id text primary key,
  lot_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  item_key text not null,
  provider_card_id text not null,
  variant_id text not null,
  variant_label text not null,
  name text not null,
  set_name text not null,
  card_number text not null,
  rarity text not null,
  condition text not null,
  market_price numeric(12, 2) not null,
  manual_market_price numeric(12, 2),
  buy_percent integer not null,
  quantity integer not null check (quantity > 0),
  price_source text not null,
  last_updated text not null,
  image_url text,
  external_url text,
  notes text not null default '',
  market_price_missing boolean not null default false,
  buy_unit_price numeric(12, 2) not null,
  buy_total numeric(12, 2) not null,
  sold_quantity integer not null default 0 check (sold_quantity >= 0),
  created_at timestamptz not null default now(),
  unique (id, user_id),
  unique (lot_id, item_key),
  constraint deal_lot_items_lot_user_fk
    foreign key (lot_id, user_id)
    references public.deal_lots(id, user_id)
    on delete cascade
);

create table if not exists public.sale_records (
  id text primary key,
  lot_id text not null,
  lot_item_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  sold_at timestamptz not null,
  quantity integer not null check (quantity > 0),
  sale_total numeric(12, 2) not null check (sale_total > 0),
  created_at timestamptz not null default now(),
  constraint sale_records_lot_user_fk
    foreign key (lot_id, user_id)
    references public.deal_lots(id, user_id)
    on delete cascade,
  constraint sale_records_lot_item_user_fk
    foreign key (lot_item_id, user_id)
    references public.deal_lot_items(id, user_id)
    on delete cascade
);

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Collector',
  city text,
  region text,
  country text not null default 'US',
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  place_name text,
  portfolio_public boolean not null default false,
  auto_mirror_deal_items boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.portfolio_items (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider_card_id text not null,
  variant_id text not null,
  variant_label text not null,
  name text not null,
  set_name text not null,
  card_number text not null,
  rarity text not null,
  image_url text,
  external_url text,
  ownership_type text not null check (ownership_type in ('raw', 'graded')),
  condition text,
  grader text,
  grade text,
  cert_number text,
  quantity integer not null check (quantity > 0),
  estimated_unit_value numeric(12, 2) not null default 0,
  price_updated_at timestamptz not null default now(),
  price_sources jsonb not null default '[]'::jsonb,
  is_public boolean not null default true,
  notes text not null default '',
  source_type text not null default 'manual' check (source_type in ('manual', 'deal')),
  source_lot_id text,
  source_lot_item_id text,
  source_lot_label text,
  source_checked_out_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  constraint portfolio_items_raw_condition_check
    check (ownership_type <> 'raw' or condition is not null),
  constraint portfolio_items_graded_check
    check (ownership_type <> 'graded' or (grader is not null and grade is not null))
);

alter table public.profiles
  add column if not exists auto_mirror_deal_items boolean not null default false;

alter table public.portfolio_items
  add column if not exists source_type text not null default 'manual',
  add column if not exists source_lot_id text,
  add column if not exists source_lot_item_id text,
  add column if not exists source_lot_label text,
  add column if not exists source_checked_out_at timestamptz;

do $$
begin
  alter table public.portfolio_items
    add constraint portfolio_items_source_type_check
    check (source_type in ('manual', 'deal'));
exception
  when duplicate_object then null;
end $$;

create index if not exists current_deals_user_id_idx on public.current_deals (user_id);
create index if not exists deal_lots_user_id_checked_out_idx on public.deal_lots (user_id, checked_out_at desc);
create index if not exists deal_lot_items_user_id_lot_id_idx on public.deal_lot_items (user_id, lot_id);
create index if not exists sale_records_user_id_lot_id_idx on public.sale_records (user_id, lot_id);
create index if not exists sale_records_lot_item_id_idx on public.sale_records (lot_item_id);
create index if not exists profiles_public_city_idx on public.profiles (portfolio_public, city, region);
create index if not exists portfolio_items_user_id_idx on public.portfolio_items (user_id);
create index if not exists portfolio_items_public_card_idx on public.portfolio_items (is_public, name, set_name);
create unique index if not exists portfolio_items_deal_source_unique_idx
on public.portfolio_items (user_id, source_lot_id, source_lot_item_id)
where source_type = 'deal'
  and source_lot_id is not null
  and source_lot_item_id is not null;

alter table public.current_deals enable row level security;
alter table public.deal_lots enable row level security;
alter table public.deal_lot_items enable row level security;
alter table public.sale_records enable row level security;
alter table public.profiles enable row level security;
alter table public.portfolio_items enable row level security;

grant select, insert, update, delete on public.current_deals to authenticated;
grant select, insert, update, delete on public.deal_lots to authenticated;
grant select, insert, update, delete on public.deal_lot_items to authenticated;
grant select, insert, update, delete on public.sale_records to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.portfolio_items to authenticated;

drop policy if exists "Users manage own current deal" on public.current_deals;
create policy "Users manage own current deal"
on public.current_deals
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage own lots" on public.deal_lots;
create policy "Users manage own lots"
on public.deal_lots
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage own lot items" on public.deal_lot_items;
create policy "Users manage own lot items"
on public.deal_lot_items
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage own sale records" on public.sale_records;
create policy "Users manage own sale records"
on public.sale_records
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage own profile" on public.profiles;
create policy "Users manage own profile"
on public.profiles
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage own portfolio items" on public.portfolio_items;
create policy "Users manage own portfolio items"
on public.portfolio_items
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create or replace function public.search_public_portfolios()
returns table (
  user_id uuid,
  display_name text,
  city text,
  region text,
  latitude numeric,
  longitude numeric,
  portfolio_item jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  select
    profiles.user_id,
    profiles.display_name,
    profiles.city,
    profiles.region,
    profiles.latitude,
    profiles.longitude,
    jsonb_build_object(
      'id', portfolio_items.id,
      'providerCardId', portfolio_items.provider_card_id,
      'variantId', portfolio_items.variant_id,
      'variantLabel', portfolio_items.variant_label,
      'name', portfolio_items.name,
      'setName', portfolio_items.set_name,
      'cardNumber', portfolio_items.card_number,
      'rarity', portfolio_items.rarity,
      'imageUrl', portfolio_items.image_url,
      'externalUrl', portfolio_items.external_url,
      'ownershipType', portfolio_items.ownership_type,
      'condition', portfolio_items.condition,
      'grader', portfolio_items.grader,
      'grade', portfolio_items.grade,
      'quantity', portfolio_items.quantity,
      'estimatedUnitValue', portfolio_items.estimated_unit_value,
      'priceUpdatedAt', portfolio_items.price_updated_at,
      'priceSources', portfolio_items.price_sources,
      'isPublic', portfolio_items.is_public
    ) as portfolio_item
  from public.profiles
  join public.portfolio_items
    on portfolio_items.user_id = profiles.user_id
  where profiles.portfolio_public = true
    and profiles.city is not null
    and profiles.region is not null
    and profiles.latitude is not null
    and profiles.longitude is not null
    and portfolio_items.is_public = true;
$$;

revoke all on function public.search_public_portfolios() from public;
grant execute on function public.search_public_portfolios() to authenticated;
