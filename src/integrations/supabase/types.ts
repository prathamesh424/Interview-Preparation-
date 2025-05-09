export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ai_cheat_sheets: {
        Row: {
          completed_subtopics: Json | null
          created_at: string
          generated_data: Json
          id: string
          study_plan_item_id: string | null
          topic_title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_subtopics?: Json | null
          created_at?: string
          generated_data: Json
          id?: string
          study_plan_item_id?: string | null
          topic_title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_subtopics?: Json | null
          created_at?: string
          generated_data?: Json
          id?: string
          study_plan_item_id?: string | null
          topic_title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string
          id: string
          key_value: string
          service_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          key_value: string
          service_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          key_value?: string
          service_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      code_snippets: {
        Row: {
          code: string
          created_at: string
          id: string
          interview_id: string
          language: string
          timestamp: number
          title: string
          updated_at: string
          user_id: string
          user_name: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          interview_id: string
          language: string
          timestamp: number
          title: string
          updated_at?: string
          user_id: string
          user_name: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          interview_id?: string
          language?: string
          timestamp?: number
          title?: string
          updated_at?: string
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "code_snippets_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "mock_interviews"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_feedback: {
        Row: {
          additional_comments: string | null
          areas_for_improvement: string | null
          communication_rating: number
          created_at: string
          id: string
          interview_id: string
          interviewee_id: string | null
          interviewer_id: string | null
          overall_rating: number
          problem_solving_rating: number
          strengths: string | null
          technical_rating: number
        }
        Insert: {
          additional_comments?: string | null
          areas_for_improvement?: string | null
          communication_rating: number
          created_at?: string
          id?: string
          interview_id: string
          interviewee_id?: string | null
          interviewer_id?: string | null
          overall_rating: number
          problem_solving_rating: number
          strengths?: string | null
          technical_rating: number
        }
        Update: {
          additional_comments?: string | null
          areas_for_improvement?: string | null
          communication_rating?: number
          created_at?: string
          id?: string
          interview_id?: string
          interviewee_id?: string | null
          interviewer_id?: string | null
          overall_rating?: number
          problem_solving_rating?: number
          strengths?: string | null
          technical_rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "interview_feedback_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "mock_interviews"
            referencedColumns: ["id"]
          },
        ]
      }
      mock_interviews: {
        Row: {
          created_at: string
          description: string | null
          feedback_id: string | null
          id: string
          interviewee_email: string | null
          interviewee_id: string | null
          interviewer_id: string
          interviewer_name: string | null
          questions: Json
          scheduled_end_time: string
          scheduled_start_time: string
          status: string
          time_zone: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          feedback_id?: string | null
          id?: string
          interviewee_email?: string | null
          interviewee_id?: string | null
          interviewer_id: string
          interviewer_name?: string | null
          questions?: Json
          scheduled_end_time: string
          scheduled_start_time: string
          status: string
          time_zone: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          feedback_id?: string | null
          id?: string
          interviewee_email?: string | null
          interviewee_id?: string | null
          interviewer_id?: string
          interviewer_name?: string | null
          questions?: Json
          scheduled_end_time?: string
          scheduled_start_time?: string
          status?: string
          time_zone?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      question_sheets: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      saved_practice_questions: {
        Row: {
          category: string | null
          created_at: string
          difficulty: string
          feedback: Json | null
          id: string
          question_id: string | null
          question_text: string
          question_type: string
          sub_category: string | null
          updated_at: string
          user_answer: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          difficulty: string
          feedback?: Json | null
          id?: string
          question_id?: string | null
          question_text: string
          question_type: string
          sub_category?: string | null
          updated_at?: string
          user_answer: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          difficulty?: string
          feedback?: Json | null
          id?: string
          question_id?: string | null
          question_text?: string
          question_type?: string
          sub_category?: string | null
          updated_at?: string
          user_answer?: string
          user_id?: string
        }
        Relationships: []
      }
      sheet_questions: {
        Row: {
          created_at: string
          difficulty: string | null
          id: string
          question_text: string
          question_type: string | null
          sheet_id: string
          topic: string | null
        }
        Insert: {
          created_at?: string
          difficulty?: string | null
          id?: string
          question_text: string
          question_type?: string | null
          sheet_id: string
          topic?: string | null
        }
        Update: {
          created_at?: string
          difficulty?: string | null
          id?: string
          question_text?: string
          question_type?: string | null
          sheet_id?: string
          topic?: string | null
        }
        Relationships: []
      }
      study_progress: {
        Row: {
          created_at: string
          id: string
          is_completed: boolean
          question_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_completed?: boolean
          question_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_completed?: boolean
          question_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_sheet_progress: {
        Row: {
          completed_at: string
          question_id: string
          sheet_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          question_id: string
          sheet_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          question_id?: string
          sheet_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sheet_progress_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "sheet_questions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
