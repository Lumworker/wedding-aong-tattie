-- Register v2.3 (W4): "เล่าเรื่องคุณกับบ่าวสาว" — optional, up to 1000 characters per party.
-- Private: only the party itself (via its session) and the host export read it.
-- The app keeps working without this column; stories are simply not saved until it exists.

alter table public.parties
  add column if not exists story text;

alter table public.parties drop constraint if exists parties_story_len;
alter table public.parties
  add constraint parties_story_len check (story is null or char_length(story) <= 1000);
