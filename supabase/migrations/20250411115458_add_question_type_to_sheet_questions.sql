-- Add question_type column to sheet_questions table

alter table public.sheet_questions
add column question_type text null; -- Allow null initially

comment on column public.sheet_questions.question_type is 'Type of question (e.g., Theory, Code Writing).';

-- Optional: Add index if filtering by type
create index if not exists idx_sheet_questions_type on public.sheet_questions(question_type);

-- Optional: Update existing rows with a default type if desired
-- UPDATE public.sheet_questions SET question_type = 'General' WHERE question_type IS NULL;
