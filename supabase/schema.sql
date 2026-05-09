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

create index if not exists current_deals_user_id_idx on public.current_deals (user_id);
create index if not exists deal_lots_user_id_checked_out_idx on public.deal_lots (user_id, checked_out_at desc);
create index if not exists deal_lot_items_user_id_lot_id_idx on public.deal_lot_items (user_id, lot_id);
create index if not exists sale_records_user_id_lot_id_idx on public.sale_records (user_id, lot_id);
create index if not exists sale_records_lot_item_id_idx on public.sale_records (lot_item_id);

alter table public.current_deals enable row level security;
alter table public.deal_lots enable row level security;
alter table public.deal_lot_items enable row level security;
alter table public.sale_records enable row level security;

grant select, insert, update, delete on public.current_deals to authenticated;
grant select, insert, update, delete on public.deal_lots to authenticated;
grant select, insert, update, delete on public.deal_lot_items to authenticated;
grant select, insert, update, delete on public.sale_records to authenticated;

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
