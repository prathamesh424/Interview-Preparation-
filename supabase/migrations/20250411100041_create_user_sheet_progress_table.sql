-- Migration to create the user_sheet_progress table

create table public.user_sheet_progress (
    user_id uuid references auth.users(id) on delete cascade not null,
    sheet_id uuid references public.question_sheets(id) on delete cascade not null,
    question_id uuid references public.sheet_questions(id) on delete cascade not null,
    completed_at timestamp with time zone default timezone('utc'::text, now()) not null,
    -- Add other fields like 'notes', 'confidence_level' if needed

    -- Composite primary key ensures a user can only mark a question on a sheet as complete once
    primary key (user_id, sheet_id, question_id)
);

-- Enable RLS - Users manage their own progress
alter table public.user_sheet_progress enable row level security;

create policy "Allow individual read access"
on public.user_sheet_progress
for select using (auth.uid() = user_id);

create policy "Allow individual insert access"
on public.user_sheet_progress
for insert with check (auth.uid() = user_id);

-- Usually, progress is marked complete, not updated. Delete might be needed.
create policy "Allow individual delete access"
on public.user_sheet_progress
for delete using (auth.uid() = user_id);

-- Add indexes for efficient querying
create index idx_user_sheet_progress_user_sheet on public.user_sheet_progress(user_id, sheet_id);

comment on table public.user_sheet_progress is 'Tracks user progress on specific questions within question sheets.';
