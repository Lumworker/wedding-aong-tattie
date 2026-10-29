alter table public.guests drop constraint if exists guests_attendance_check;

alter table public.guests
  add constraint guests_attendance_check
  check (attendance in ('attending', 'unsure', 'declined'));
