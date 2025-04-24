-- Migration to create the sheet_questions table

create table public.sheet_questions (
    id uuid primary key default gen_random_uuid(),
    sheet_id uuid references public.question_sheets(id) on delete cascade not null,
    question_text text not null,
    difficulty text null, -- e.g., Easy, Medium, Hard
    topic text null, -- e.g., Arrays, Promises, System Design
    -- Add other relevant fields like 'answer', 'hints', 'source_url' if needed
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
    -- No updated_at needed if questions are typically static once added to a sheet
);

-- Enable RLS (assuming public read, admin management)
alter table public.sheet_questions enable row level security;

-- Example: Allow public read access
create policy "Allow public read access"
on public.sheet_questions
for select using (true);

-- Example: Allow admin insert/update/delete (requires admin role setup)
-- create policy "Allow admin management"
-- on public.sheet_questions
-- for all using (is_admin(auth.uid())); -- Replace is_admin with your role check function

-- Add indexes
create index idx_sheet_questions_sheet_id on public.sheet_questions(sheet_id);
create index idx_sheet_questions_topic on public.sheet_questions(topic); -- If filtering by topic

comment on table public.sheet_questions is 'Stores individual questions belonging to a specific question sheet.';
