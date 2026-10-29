-- Wedding RSVP: one party per Thai mobile, guests in that party, and wishes.
-- The Next.js server talks to these tables with the secret key (service_role).
-- The publishable key has no grants and no RLS policies, so the browser cannot read or write rows.

create table public.parties (
  phone text primary key,
  updated_at timestamptz not null default now(),
  constraint parties_phone_thai_mobile check (phone ~ '^0[689][0-9]{8}$')
);

create table public.guests (
  id text primary key,
  party_phone text not null references public.parties (phone) on delete cascade,
  name text not null,
  gender text not null,
  age_group text not null default 'adult',
  attendance text not null,
  side text,
  is_companion boolean not null default false,
  position smallint not null,
  constraint guests_name_len check (char_length(name) between 1 and 80),
  constraint guests_gender_check check (gender in ('male', 'female', 'other')),
  constraint guests_age_group_check check (age_group in ('adult', 'child')),
  constraint guests_attendance_check check (attendance in ('attending', 'unsure', 'declined')),
  constraint guests_side_check check (side is null or side in ('groom', 'bride')),
  constraint guests_position_check check (position >= 0 and position < 10),
  constraint guests_party_position_key unique (party_phone, position)
);

create unique index guests_one_primary_per_party
  on public.guests (party_phone)
  where not is_companion;

create table public.wishes (
  id text primary key,
  message text not null,
  from_name text not null,
  party_phone text not null references public.parties (phone) on delete cascade,
  created_at timestamptz not null default now(),
  constraint wishes_message_len check (char_length(message) between 1 and 200),
  constraint wishes_from_len check (char_length(from_name) between 1 and 80)
);

create index wishes_party_phone_idx on public.wishes (party_phone);
create index wishes_created_at_idx on public.wishes (created_at desc);

alter table public.parties enable row level security;
alter table public.guests enable row level security;
alter table public.wishes enable row level security;

revoke all on table public.parties from anon, authenticated;
revoke all on table public.guests from anon, authenticated;
revoke all on table public.wishes from anon, authenticated;

grant select, insert, update, delete on table public.parties to service_role;
grant select, insert, update, delete on table public.guests to service_role;
grant select, insert, update, delete on table public.wishes to service_role;

create or replace function public.save_party(
  p_phone text,
  p_updated_at timestamptz,
  p_guests jsonb
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  guest_count integer;
  primary_count integer;
begin
  if p_phone is null or p_phone !~ '^0[689][0-9]{8}$' then
    raise exception 'เบอร์โทรไม่ถูกต้อง';
  end if;

  guest_count := coalesce(jsonb_array_length(p_guests), 0);
  if guest_count < 1 or guest_count > 10 then
    raise exception 'จำนวนคนในกลุ่มต้องอยู่ระหว่าง 1 ถึง 10';
  end if;

  select count(*)
  into primary_count
  from jsonb_array_elements(p_guests) as item(value)
  where coalesce((item.value ->> 'isCompanion')::boolean, false) = false;

  if primary_count <> 1 then
    raise exception 'ต้องมีผู้ลงทะเบียนหลักหนึ่งคน';
  end if;

  insert into public.parties (phone, updated_at)
  values (p_phone, coalesce(p_updated_at, now()))
  on conflict (phone) do update
  set updated_at = excluded.updated_at;

  delete from public.guests
  where party_phone = p_phone;

  insert into public.guests (
    id,
    party_phone,
    name,
    gender,
    age_group,
    attendance,
    side,
    is_companion,
    position
  )
  select
    item.value ->> 'id',
    p_phone,
    btrim(item.value ->> 'name'),
    item.value ->> 'gender',
    coalesce(nullif(item.value ->> 'ageGroup', ''), 'adult'),
    item.value ->> 'attendance',
    nullif(item.value ->> 'side', ''),
    coalesce((item.value ->> 'isCompanion')::boolean, false),
    (item.ord - 1)::smallint
  from jsonb_array_elements(p_guests) with ordinality as item(value, ord);
end;
$$;

revoke all on function public.save_party(text, timestamptz, jsonb) from public, anon, authenticated;
grant execute on function public.save_party(text, timestamptz, jsonb) to service_role;

create or replace function public.trim_wishes()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  delete from public.wishes
  where id in (
    select id
    from public.wishes
    order by created_at desc, id desc
    offset 200
  );
  return null;
end;
$$;

revoke all on function public.trim_wishes() from public, anon, authenticated;

create trigger wishes_trim
after insert on public.wishes
for each statement
execute function public.trim_wishes();
