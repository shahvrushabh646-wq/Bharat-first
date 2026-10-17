-- Initial Shopora schema. Run in Supabase SQL Editor.
create extension if not exists pgcrypto;
create table if not exists public.products(
 id uuid primary key default gen_random_uuid(), name text not null, category text not null,
 description text not null default '', price numeric(12,2) not null check(price>=0),
 compare_at_price numeric(12,2), stock integer not null default 0 check(stock>=0),
 emoji text default '📦', color text default '#e8eaf4', image_url text,
 active boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists public.orders(
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete restrict,
 order_number text not null unique, customer_name text not null, phone text not null,
 address text not null, city text not null, pincode text not null, items jsonb not null,
 subtotal numeric(12,2) not null check(subtotal>=0), delivery_fee numeric(12,2) not null default 0,
 total numeric(12,2) not null check(total>=0), payment_method text not null default 'Cash on Delivery',
 payment_status text not null default 'pending', status text not null default 'Order placed',
 created_at timestamptz not null default now()
);
create table if not exists public.profiles(
 id uuid primary key references auth.users(id) on delete cascade, full_name text, phone text,
 role text not null default 'customer' check(role in('customer','admin')), created_at timestamptz not null default now()
);
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.profiles enable row level security;
drop policy if exists "Anyone can view active products" on public.products;
create policy "Anyone can view active products" on public.products for select using(active=true);
drop policy if exists "Customers read own orders" on public.orders;
create policy "Customers read own orders" on public.orders for select to authenticated using(auth.uid()=user_id);
drop policy if exists "Customers create own orders" on public.orders;
create policy "Customers create own orders" on public.orders for insert to authenticated with check(auth.uid()=user_id);
drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile" on public.profiles for select to authenticated using(auth.uid()=id);
-- Add server-enforced admin policies before production. Do not allow users to self-assign role=admin.
-- Use a server/Edge Function to verify prices, stock and payment signatures. Never trust client totals.
