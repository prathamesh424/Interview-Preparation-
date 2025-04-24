

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";





SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."api_keys" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "service_name" "text" NOT NULL,
    "key_value" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."api_keys" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."code_snippets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "interview_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "code" "text" NOT NULL,
    "language" "text" NOT NULL,
    "timestamp" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "user_name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."code_snippets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."interview_feedback" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "interview_id" "uuid" NOT NULL,
    "overall_rating" integer NOT NULL,
    "communication_rating" integer NOT NULL,
    "technical_rating" integer NOT NULL,
    "problem_solving_rating" integer NOT NULL,
    "strengths" "text",
    "areas_for_improvement" "text",
    "additional_comments" "text",
    "interviewer_id" "uuid",
    "interviewee_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."interview_feedback" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mock_interviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "scheduled_start_time" timestamp with time zone NOT NULL,
    "scheduled_end_time" timestamp with time zone NOT NULL,
    "time_zone" "text" NOT NULL,
    "status" "text" NOT NULL,
    "interviewer_id" "uuid" NOT NULL,
    "interviewee_id" "uuid",
    "interviewee_email" "text",
    "interviewer_name" "text",
    "questions" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "feedback_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."mock_interviews" OWNER TO "postgres";


ALTER TABLE ONLY "public"."api_keys"
    ADD CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."code_snippets"
    ADD CONSTRAINT "code_snippets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interview_feedback"
    ADD CONSTRAINT "interview_feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mock_interviews"
    ADD CONSTRAINT "mock_interviews_pkey" PRIMARY KEY ("id");



CREATE INDEX "code_snippets_interview_id_idx" ON "public"."code_snippets" USING "btree" ("interview_id");



CREATE INDEX "code_snippets_user_id_idx" ON "public"."code_snippets" USING "btree" ("user_id");



CREATE INDEX "interview_feedback_interview_id_idx" ON "public"."interview_feedback" USING "btree" ("interview_id");



CREATE INDEX "mock_interviews_interviewee_email_idx" ON "public"."mock_interviews" USING "btree" ("interviewee_email");



CREATE INDEX "mock_interviews_interviewee_id_idx" ON "public"."mock_interviews" USING "btree" ("interviewee_id");



CREATE INDEX "mock_interviews_interviewer_id_idx" ON "public"."mock_interviews" USING "btree" ("interviewer_id");



ALTER TABLE ONLY "public"."api_keys"
    ADD CONSTRAINT "api_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."code_snippets"
    ADD CONSTRAINT "code_snippets_interview_id_fkey" FOREIGN KEY ("interview_id") REFERENCES "public"."mock_interviews"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."code_snippets"
    ADD CONSTRAINT "code_snippets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interview_feedback"
    ADD CONSTRAINT "interview_feedback_interview_id_fkey" FOREIGN KEY ("interview_id") REFERENCES "public"."mock_interviews"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interview_feedback"
    ADD CONSTRAINT "interview_feedback_interviewee_id_fkey" FOREIGN KEY ("interviewee_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interview_feedback"
    ADD CONSTRAINT "interview_feedback_interviewer_id_fkey" FOREIGN KEY ("interviewer_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mock_interviews"
    ADD CONSTRAINT "mock_interviews_interviewee_id_fkey" FOREIGN KEY ("interviewee_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mock_interviews"
    ADD CONSTRAINT "mock_interviews_interviewer_id_fkey" FOREIGN KEY ("interviewer_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Users can delete interviews they conduct" ON "public"."mock_interviews" FOR DELETE USING (("interviewer_id" = "auth"."uid"()));



CREATE POLICY "Users can delete their own API keys" ON "public"."api_keys" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own snippets" ON "public"."code_snippets" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert feedback for interviews they conduct" ON "public"."interview_feedback" FOR INSERT WITH CHECK (("interview_id" IN ( SELECT "mock_interviews"."id"
   FROM "public"."mock_interviews"
  WHERE ("mock_interviews"."interviewer_id" = "auth"."uid"()))));



CREATE POLICY "Users can insert interviews they conduct" ON "public"."mock_interviews" FOR INSERT WITH CHECK (("interviewer_id" = "auth"."uid"()));



CREATE POLICY "Users can insert snippets for their interviews" ON "public"."code_snippets" FOR INSERT WITH CHECK (("interview_id" IN ( SELECT "mock_interviews"."id"
   FROM "public"."mock_interviews"
  WHERE (("mock_interviews"."interviewer_id" = "auth"."uid"()) OR ("mock_interviews"."interviewee_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert their own API keys" ON "public"."api_keys" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update interviews they're part of" ON "public"."mock_interviews" FOR UPDATE USING ((("interviewer_id" = "auth"."uid"()) OR ("interviewee_id" = "auth"."uid"()))) WITH CHECK ((("interviewer_id" = "auth"."uid"()) OR ("interviewee_id" = "auth"."uid"())));



CREATE POLICY "Users can update their own API keys" ON "public"."api_keys" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own snippets" ON "public"."code_snippets" FOR UPDATE USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view feedback for their interviews" ON "public"."interview_feedback" FOR SELECT USING (("interview_id" IN ( SELECT "mock_interviews"."id"
   FROM "public"."mock_interviews"
  WHERE (("mock_interviews"."interviewer_id" = "auth"."uid"()) OR ("mock_interviews"."interviewee_id" = "auth"."uid"())))));



CREATE POLICY "Users can view snippets for their interviews" ON "public"."code_snippets" FOR SELECT USING (("interview_id" IN ( SELECT "mock_interviews"."id"
   FROM "public"."mock_interviews"
  WHERE (("mock_interviews"."interviewer_id" = "auth"."uid"()) OR ("mock_interviews"."interviewee_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own API keys" ON "public"."api_keys" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own interviews" ON "public"."mock_interviews" FOR SELECT USING ((("interviewer_id" = "auth"."uid"()) OR ("interviewee_id" = "auth"."uid"()) OR ("interviewee_email" = ("auth"."jwt"() ->> 'email'::"text"))));



ALTER TABLE "public"."api_keys" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."code_snippets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."interview_feedback" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mock_interviews" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



































































































































































































GRANT ALL ON TABLE "public"."api_keys" TO "anon";
GRANT ALL ON TABLE "public"."api_keys" TO "authenticated";
GRANT ALL ON TABLE "public"."api_keys" TO "service_role";



GRANT ALL ON TABLE "public"."code_snippets" TO "anon";
GRANT ALL ON TABLE "public"."code_snippets" TO "authenticated";
GRANT ALL ON TABLE "public"."code_snippets" TO "service_role";



GRANT ALL ON TABLE "public"."interview_feedback" TO "anon";
GRANT ALL ON TABLE "public"."interview_feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."interview_feedback" TO "service_role";



GRANT ALL ON TABLE "public"."mock_interviews" TO "anon";
GRANT ALL ON TABLE "public"."mock_interviews" TO "authenticated";
GRANT ALL ON TABLE "public"."mock_interviews" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
