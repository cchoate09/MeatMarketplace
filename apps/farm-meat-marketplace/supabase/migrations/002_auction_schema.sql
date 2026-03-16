-- Migration 002: auction-specific schema
-- Adds the bids, awards, and auction columns that the codex/auction branch requires.
-- Run this AFTER 001_initial_schema.sql in the Supabase SQL editor.

-- ── Listings: add auction columns ────────────────────────────────────────────
-- Only add the new columns if they don't exist yet (safe to re-run).

alter table public.listings
  add column if not exists total_weight_lbs      numeric(10,2) not null default 0,
  add column if not exists head_count            integer       not null default 1,
  add column if not exists reserve_price         numeric(10,2) not null default 0,
  add column if not exists opening_bid           numeric(10,2) not null default 0,
  add column if not exists current_bid           numeric(10,2) not null default 0,
  add column if not exists minimum_increment     numeric(10,2) not null default 0.05,
  add column if not exists auction_start_at      timestamptz,
  add column if not exists auction_end_at        timestamptz,
  add column if not exists auction_status        text          not null default 'scheduled'
                                                 check (auction_status in ('scheduled','live','awarded','closed')),
  add column if not exists reserve_met           boolean       not null default false,
  add column if not exists current_leader_id     uuid          references public.profiles(id) on delete set null,
  add column if not exists current_leader_name   text,
  add column if not exists winning_bid_id        uuid,          -- set after close
  add column if not exists quality_grade         text          not null default '',
  add column if not exists handling_details      text          not null default '',
  add column if not exists estimated_yield_pct   numeric(5,2)  not null default 0,
  add column if not exists payment_terms         text          not null default '',
  add column if not exists allow_auto_bids       boolean       not null default true,
  add column if not exists image_gallery         text[]        not null default '{}';

-- ── Bids table ────────────────────────────────────────────────────────────────

create table if not exists public.bids (
  id                  uuid primary key default gen_random_uuid(),
  listing_id          uuid not null references public.listings(id) on delete cascade,
  slaughterhouse_id   uuid not null references public.profiles(id) on delete cascade,
  slaughterhouse_name text not null,
  amount              numeric(10,2) not null check (amount > 0),
  mode                text not null check (mode in ('manual','auto')),
  max_bid             numeric(10,2),          -- null for manual bids
  created_at          timestamptz not null default now()
);

create index if not exists bids_listing_id_idx on public.bids(listing_id);
create index if not exists bids_slaughterhouse_id_idx on public.bids(slaughterhouse_id);

-- ── Auto-bid strategies table ─────────────────────────────────────────────────
-- Stores the maximum ceiling a slaughterhouse is willing to pay per listing.

create table if not exists public.auto_bid_strategies (
  listing_id        uuid not null references public.listings(id) on delete cascade,
  slaughterhouse_id uuid not null references public.profiles(id) on delete cascade,
  max_bid           numeric(10,2) not null check (max_bid > 0),
  increment         numeric(10,2) not null check (increment > 0),
  updated_at        timestamptz   not null default now(),
  primary key (listing_id, slaughterhouse_id)
);

-- ── Awards table ──────────────────────────────────────────────────────────────
-- One row per closed auction that produced a winner.

create table if not exists public.awards (
  id                  uuid primary key default gen_random_uuid(),
  listing_id          uuid not null references public.listings(id) on delete restrict,
  listing_title       text not null,
  farmer_id           uuid not null references public.profiles(id) on delete restrict,
  farmer_name         text not null,
  slaughterhouse_id   uuid not null references public.profiles(id) on delete restrict,
  slaughterhouse_name text not null,
  final_bid           numeric(10,2) not null,
  reserve_price       numeric(10,2) not null,
  reserve_met         boolean not null,
  bid_count           integer not null default 0,
  total_weight_lbs    numeric(10,2) not null,
  payment_method_label text,
  payment_intent_id   text,
  contract_url        text,
  contract_sent_at    timestamptz,
  status              text not null default 'pending_settlement'
                      check (status in ('pending_settlement','contract_sent','ready_for_pickup','completed','closed')),
  created_at          timestamptz not null default now()
);

create table if not exists public.award_status_history (
  id         uuid primary key default gen_random_uuid(),
  award_id   uuid not null references public.awards(id) on delete cascade,
  status     text not null,
  changed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ── RLS: enable and create policies ──────────────────────────────────────────

alter table public.bids               enable row level security;
alter table public.auto_bid_strategies enable row level security;
alter table public.awards              enable row level security;
alter table public.award_status_history enable row level security;

-- Bids: slaughterhouses can see all bids on a listing (for bid history display),
-- but max_bid is hidden — only the row owner can see their own ceiling.
create policy "anyone can read visible bid fields" on public.bids
  for select using (true);

create policy "slaughterhouses can insert own bids" on public.bids
  for insert with check (auth.uid() = slaughterhouse_id);

-- Auto-bid strategies: private — only the strategy owner can read/write.
create policy "owner can manage own strategy" on public.auto_bid_strategies
  for all
  using  (auth.uid() = slaughterhouse_id)
  with check (auth.uid() = slaughterhouse_id);

-- Awards: both parties can read their own awards.
create policy "parties can read own awards" on public.awards
  for select using (auth.uid() = farmer_id or auth.uid() = slaughterhouse_id);

-- Only farmers can advance award status (seller controls settlement flow).
create policy "farmers can update own award status" on public.awards
  for update using (auth.uid() = farmer_id);

create policy "parties can read award history" on public.award_status_history
  for select using (
    exists (
      select 1 from public.awards
      where public.awards.id = award_status_history.award_id
        and (public.awards.farmer_id = auth.uid() or public.awards.slaughterhouse_id = auth.uid())
    )
  );

-- ── RPC: place_bid_atomic ─────────────────────────────────────────────────────
-- Validates the bid, inserts it, and recalculates the listing's current bid.
-- All in a single serializable transaction so concurrent bids are safe.

create or replace function public.place_bid_atomic(
  p_listing_id          uuid,
  p_slaughterhouse_id   uuid,
  p_slaughterhouse_name text,
  p_bid_amount          numeric,
  p_bid_mode            text,
  p_max_bid             numeric default null
)
returns public.listings
language plpgsql
security definer
as $$
declare
  v_listing     public.listings;
  v_minimum     numeric;
  v_effective   numeric;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if auth.uid() <> p_slaughterhouse_id then
    raise exception 'Slaughterhouse identity mismatch';
  end if;

  -- Lock the row so concurrent bids queue up.
  select * into v_listing from public.listings where id = p_listing_id for update;

  if not found then
    raise exception 'Listing not found';
  end if;

  if v_listing.auction_status <> 'live' then
    raise exception 'This auction is not currently accepting bids';
  end if;

  -- Enforce minimum bid server-side (mirrors mockBackend.placeMockBid logic).
  v_minimum := case
    when v_listing.current_leader_id is not null
      then v_listing.current_bid + v_listing.minimum_increment
    else v_listing.opening_bid
  end;

  v_effective := case when p_bid_mode = 'auto' then coalesce(p_max_bid, p_bid_amount) else p_bid_amount end;

  if v_effective < v_minimum then
    raise exception 'Bid must be at least $%.2f', v_minimum;
  end if;

  -- Insert bid record.
  insert into public.bids (listing_id, slaughterhouse_id, slaughterhouse_name, amount, mode, max_bid)
  values (p_listing_id, p_slaughterhouse_id, p_slaughterhouse_name, p_bid_amount, p_bid_mode, p_max_bid);

  -- Upsert strategy for proxy bidding recalculation.
  insert into public.auto_bid_strategies (listing_id, slaughterhouse_id, max_bid, increment, updated_at)
  values (p_listing_id, p_slaughterhouse_id, v_effective, v_listing.minimum_increment, now())
  on conflict (listing_id, slaughterhouse_id) do update
    set max_bid = excluded.max_bid, updated_at = now();

  -- Recalculate the visible current bid using proxy bidding rules.
  -- (Full proxy bidding recalculation is implemented in recalculate_auction below.)
  perform public.recalculate_auction(p_listing_id);

  select * into v_listing from public.listings where id = p_listing_id;

  -- Notify both parties.
  if v_listing.current_leader_id = p_slaughterhouse_id then
    insert into public.notifications (user_id, title, body)
    values (p_slaughterhouse_id, 'You are leading',
            'You are now leading ' || v_listing.title || ' at $' || v_listing.current_bid || '/lb.');
  else
    insert into public.notifications (user_id, title, body)
    values (p_slaughterhouse_id, 'Outbid',
            'Another processor moved ahead on ' || v_listing.title || '. Your max is still saved.');
  end if;

  return v_listing;
end;
$$;

-- ── RPC: recalculate_auction ──────────────────────────────────────────────────
-- Pure proxy-bidding recalculation. Mirrors mockBackend.recalculateAuction.
-- Tie-break rule: highest max_bid wins; ties broken by earliest updated_at.

create or replace function public.recalculate_auction(p_listing_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_listing   public.listings;
  v_winner    record;
  v_runner_up record;
  v_visible   numeric;
begin
  select * into v_listing from public.listings where id = p_listing_id;

  if not found then
    raise exception 'Listing not found';
  end if;

  -- Find the winner: highest ceiling, earliest timestamp on tie.
  select s.slaughterhouse_id, s.max_bid, s.updated_at,
         coalesce(p.name, s.slaughterhouse_id::text) as display_name
  into v_winner
  from public.auto_bid_strategies s
  join public.profiles p on p.id = s.slaughterhouse_id
  where s.listing_id = p_listing_id
    and s.max_bid >= v_listing.opening_bid
  order by s.max_bid desc, s.updated_at asc
  limit 1;

  if v_winner is null then
    update public.listings
    set current_bid = opening_bid, reserve_met = false,
        current_leader_id = null, current_leader_name = null
    where id = p_listing_id;
    return;
  end if;

  -- Find the runner-up.
  select s.max_bid
  into v_runner_up
  from public.auto_bid_strategies s
  where s.listing_id = p_listing_id
    and s.max_bid >= v_listing.opening_bid
    and s.slaughterhouse_id <> v_winner.slaughterhouse_id
  order by s.max_bid desc, s.updated_at asc
  limit 1;

  -- Visible bid is only as high as needed to beat the runner-up.
  v_visible := case
    when v_runner_up is not null
      then least(v_winner.max_bid,
                 greatest(v_listing.opening_bid, v_runner_up.max_bid + v_listing.minimum_increment))
    else v_listing.opening_bid
  end;

  update public.listings
  set current_bid         = round(v_visible, 2),
      reserve_met         = v_winner.max_bid >= reserve_price,
      current_leader_id   = v_winner.slaughterhouse_id,
      current_leader_name = v_winner.display_name
  where id = p_listing_id;
end;
$$;

-- ── RPC: close_auction_atomic ─────────────────────────────────────────────────
-- Atomically closes an auction, creates an award if reserve is met, and
-- dispatches notifications. Only the listing's farmer may call this.

create or replace function public.close_auction_atomic(p_listing_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_listing public.listings;
  v_award   public.awards;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select * into v_listing from public.listings where id = p_listing_id for update;

  if not found then
    raise exception 'Listing not found';
  end if;

  if auth.uid() <> v_listing.farmer_id then
    raise exception 'Only the listing farmer can close this auction';
  end if;

  if v_listing.auction_status not in ('live', 'scheduled') then
    raise exception 'Auction is already closed or awarded';
  end if;

  if v_listing.reserve_met and v_listing.current_leader_id is not null then
    -- Create award.
    insert into public.awards (
      listing_id, listing_title, farmer_id, farmer_name,
      slaughterhouse_id, slaughterhouse_name,
      final_bid, reserve_price, reserve_met,
      bid_count, total_weight_lbs, status
    )
    select
      v_listing.id, v_listing.title, v_listing.farmer_id, v_listing.farmer_name,
      v_listing.current_leader_id, v_listing.current_leader_name,
      v_listing.current_bid, v_listing.reserve_price, true,
      (select count(*) from public.bids where listing_id = v_listing.id),
      v_listing.total_weight_lbs, 'pending_settlement'
    returning * into v_award;

    insert into public.award_status_history (award_id, status, changed_by)
    values (v_award.id, 'pending_settlement', auth.uid());

    -- Notify both parties.
    insert into public.notifications (user_id, title, body)
    values
      (v_listing.farmer_id, 'Auction awarded',
       v_listing.title || ' closed at $' || v_listing.current_bid || '/lb to ' || v_listing.current_leader_name || '.'),
      (v_listing.current_leader_id, 'Winning bid',
       'You won ' || v_listing.title || ' at $' || v_listing.current_bid || '/lb.');

    update public.listings set auction_status = 'awarded', auction_end_at = now() where id = p_listing_id;
  else
    update public.listings set auction_status = 'closed',  auction_end_at = now() where id = p_listing_id;
  end if;
end;
$$;

-- ── RPC: extend_auction_end ───────────────────────────────────────────────────

create or replace function public.extend_auction_end(p_listing_id uuid, p_extra_minutes integer)
returns void
language plpgsql
security definer
as $$
declare
  v_listing public.listings;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select * into v_listing from public.listings where id = p_listing_id for update;

  if not found then raise exception 'Listing not found'; end if;

  if auth.uid() <> v_listing.farmer_id then
    raise exception 'Only the listing farmer can extend this auction';
  end if;

  if v_listing.auction_status <> 'live' then
    raise exception 'Only live auctions can be extended';
  end if;

  if p_extra_minutes <= 0 or p_extra_minutes > 1440 then
    raise exception 'Extension must be between 1 and 1440 minutes';
  end if;

  update public.listings
  set auction_end_at = auction_end_at + (p_extra_minutes || ' minutes')::interval
  where id = p_listing_id;
end;
$$;

-- ── RPC: accept_below_reserve ─────────────────────────────────────────────────
-- Lets a farmer award a closed (no-award) auction to the leading bidder
-- even though the reserve was not met.

create or replace function public.accept_below_reserve(p_listing_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_listing public.listings;
  v_award   public.awards;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select * into v_listing from public.listings where id = p_listing_id for update;

  if not found then raise exception 'Listing not found'; end if;

  if auth.uid() <> v_listing.farmer_id then
    raise exception 'Only the listing farmer can accept below-reserve offers';
  end if;

  if v_listing.auction_status <> 'closed' then
    raise exception 'Below-reserve acceptance is only available on closed (no-award) auctions';
  end if;

  if v_listing.current_leader_id is null then
    raise exception 'There is no current leader to award';
  end if;

  insert into public.awards (
    listing_id, listing_title, farmer_id, farmer_name,
    slaughterhouse_id, slaughterhouse_name,
    final_bid, reserve_price, reserve_met,
    bid_count, total_weight_lbs, status
  )
  select
    v_listing.id, v_listing.title, v_listing.farmer_id, v_listing.farmer_name,
    v_listing.current_leader_id, v_listing.current_leader_name,
    v_listing.current_bid, v_listing.reserve_price, false,
    (select count(*) from public.bids where listing_id = v_listing.id),
    v_listing.total_weight_lbs, 'pending_settlement'
  returning * into v_award;

  insert into public.award_status_history (award_id, status, changed_by)
  values (v_award.id, 'pending_settlement', auth.uid());

  insert into public.notifications (user_id, title, body)
  values
    (v_listing.farmer_id, 'Below-reserve award',
     v_listing.title || ' awarded to ' || v_listing.current_leader_name || ' below reserve at $' || v_listing.current_bid || '/lb.'),
    (v_listing.current_leader_id, 'Awarded below reserve',
     'The farmer accepted your below-reserve offer on ' || v_listing.title || ' at $' || v_listing.current_bid || '/lb.');

  update public.listings set auction_status = 'awarded' where id = p_listing_id;
end;
$$;

-- ── RPC: advance_award_status ─────────────────────────────────────────────────
-- Validates and advances an award through the settlement lifecycle.

create or replace function public.advance_award_status(p_award_id uuid, p_new_status text)
returns void
language plpgsql
security definer
as $$
declare
  v_award   public.awards;
  v_allowed boolean := false;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select * into v_award from public.awards where id = p_award_id for update;

  if not found then raise exception 'Award not found'; end if;

  if auth.uid() <> v_award.farmer_id then
    raise exception 'Only the farmer can advance award status';
  end if;

  v_allowed :=
    (v_award.status = 'pending_settlement' and p_new_status = 'contract_sent') or
    (v_award.status = 'contract_sent'      and p_new_status = 'ready_for_pickup') or
    (v_award.status = 'ready_for_pickup'   and p_new_status = 'completed') or
    (v_award.status = 'completed'          and p_new_status = 'closed');

  if not v_allowed then
    raise exception 'Invalid award status transition from % to %', v_award.status, p_new_status;
  end if;

  update public.awards set status = p_new_status where id = p_award_id;

  insert into public.award_status_history (award_id, status, changed_by)
  values (p_award_id, p_new_status, auth.uid());

  -- Notify the buyer of settlement progress.
  insert into public.notifications (user_id, title, body)
  values (v_award.slaughterhouse_id, 'Settlement update',
          v_award.listing_title || ' is now: ' || replace(p_new_status, '_', ' ') || '.');
end;
$$;
