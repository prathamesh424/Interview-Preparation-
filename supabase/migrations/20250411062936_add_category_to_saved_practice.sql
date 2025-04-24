-- Add a category column to saved_practice_questions table

alter table public.saved_practice_questions
add column category text null;

comment on column public.saved_practice_questions.category is 'User-defined category or subject for the saved question.';

-- Optional: Add an index if you plan to filter by category frequently
create index if not exists idx_saved_practice_questions_category on public.saved_practice_questions(category);
