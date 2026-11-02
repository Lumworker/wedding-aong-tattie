-- Travel + parking per party, with car plates unique across the whole guest list.
-- Apply BEFORE deploying the register stepper v2. The app falls back to saving
-- without travel data while these objects are missing.

alter table public.parties
  add column if not exists travel_mode text,
  add column if not exists needs_parking boolean;

alter table public.parties drop constraint if exists parties_travel_mode_check;
alter table public.parties
  add constraint parties_travel_mode_check
  check (travel_mode is null or travel_mode in ('drive', 'taxi', 'transit', 'dropoff', 'unknown'));

create table if not exists public.party_cars (
  id text primary key,
  party_phone text not null references public.parties (phone) on delete cascade,
  plate_raw text not null,
  plate_norm text not null,
  province text not null,
  position smallint not null,
  constraint party_cars_position_check check (position between 0 and 2),
  constraint party_cars_plate_len check (char_length(plate_norm) between 2 and 10),
  constraint party_cars_party_position_key unique (party_phone, position)
);

create unique index if not exists party_cars_plate_unique
  on public.party_cars (plate_norm, province);

alter table public.party_cars enable row level security;
revoke all on table public.party_cars from anon, authenticated;
grant select, insert, update, delete on table public.party_cars to service_role;

-- save_party_v2: guests + travel + cars in one transaction.
-- A plate already held by another party raises 'ทะเบียนซ้ำ:<plate_norm>:<province>'.
create or replace function public.save_party_v2(
  p_phone text,
  p_updated_at timestamptz,
  p_guests jsonb,
  p_travel jsonb
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  car jsonb;
  taken text;
begin
  perform public.save_party(p_phone, p_updated_at, p_guests);

  update public.parties
  set travel_mode = nullif(p_travel ->> 'mode', ''),
      needs_parking = (p_travel ->> 'needsParking')::boolean
  where phone = p_phone;

  delete from public.party_cars where party_phone = p_phone;

  for car in select value from jsonb_array_elements(coalesce(p_travel -> 'cars', '[]'::jsonb)) loop
    select party_phone into taken
    from public.party_cars
    where plate_norm = car ->> 'plateNorm' and province = car ->> 'province';
    if taken is not null then
      raise exception 'ทะเบียนซ้ำ:%:%', car ->> 'plateNorm', car ->> 'province';
    end if;
    insert into public.party_cars (id, party_phone, plate_raw, plate_norm, province, position)
    values (
      car ->> 'id',
      p_phone,
      btrim(car ->> 'plate'),
      car ->> 'plateNorm',
      car ->> 'province',
      (car ->> 'position')::smallint
    );
  end loop;
exception
  when unique_violation then
    raise exception 'ทะเบียนซ้ำ:%:%', coalesce(car ->> 'plateNorm', ''), coalesce(car ->> 'province', '');
end;
$$;

revoke all on function public.save_party_v2(text, timestamptz, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.save_party_v2(text, timestamptz, jsonb, jsonb) to service_role;
