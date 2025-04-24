-- Migration to create the question_sheets table

create table public.question_sheets (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    description text null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
    -- Add other relevant fields like 'topic', 'source_url', etc. if needed
);

-- Enable RLS (assuming sheets are public or managed by admins, adjust policies as needed)
alter table public.question_sheets enable row level security;

-- Example: Allow public read access
create policy "Allow public read access"
on public.question_sheets
for select using (true);

-- Example: Allow admin insert/update/delete (requires admin role setup)
-- create policy "Allow admin management"
-- on public.question_sheets
-- for all using (is_admin(auth.uid())); -- Replace is_admin with your role check function

-- Trigger for updated_at
create trigger on_question_sheets_updated
before update on public.question_sheets
for each row
execute function public.handle_updated_at(); -- Reuse existing function

comment on table public.question_sheets is 'Stores curated lists or sheets of practice questions.';
