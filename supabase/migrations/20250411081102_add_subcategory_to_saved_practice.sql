-- Add a sub_category column to saved_practice_questions table

alter table public.saved_practice_questions
add column sub_category text null;

comment on column public.saved_practice_questions.sub_category is 'User-defined sub-category for more granular organization.';

-- Optional: Add an index if you plan to filter by sub_category frequently
create index if not exists idx_saved_practice_questions_sub_category on public.saved_practice_questions(sub_category);
