export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      analysis_reports: {
        Row: {
          created_at: string
          generated_by: string | null
          id: string
          patient_id: string
          pdf_url: string | null
          report_data: Json | null
          report_type: string
          scan_id: string | null
        }
        Insert: {
          created_at?: string
          generated_by?: string | null
          id?: string
          patient_id: string
          pdf_url?: string | null
          report_data?: Json | null
          report_type?: string
          scan_id?: string | null
        }
        Update: {
          created_at?: string
          generated_by?: string | null
          id?: string
          patient_id?: string
          pdf_url?: string | null
          report_data?: Json | null
          report_type?: string
          scan_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analysis_reports_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analysis_reports_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "medical_scans"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          created_at: string
          department: string
          doctor_id: string
          duration_minutes: number
          id: string
          notes: string | null
          patient_id: string
          scheduled_at: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department: string
          doctor_id: string
          duration_minutes?: number
          id?: string
          notes?: string | null
          patient_id: string
          scheduled_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string
          doctor_id?: string
          duration_minutes?: number
          id?: string
          notes?: string | null
          patient_id?: string
          scheduled_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_results: {
        Row: {
          collected_at: string
          created_at: string
          id: string
          notes: string | null
          ordered_by: string | null
          patient_id: string
          resulted_at: string | null
          status: string
          test_type_id: string
          unit: string
          value: number
        }
        Insert: {
          collected_at?: string
          created_at?: string
          id?: string
          notes?: string | null
          ordered_by?: string | null
          patient_id: string
          resulted_at?: string | null
          status?: string
          test_type_id: string
          unit: string
          value: number
        }
        Update: {
          collected_at?: string
          created_at?: string
          id?: string
          notes?: string | null
          ordered_by?: string | null
          patient_id?: string
          resulted_at?: string | null
          status?: string
          test_type_id?: string
          unit?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "lab_results_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_results_test_type_id_fkey"
            columns: ["test_type_id"]
            isOneToOne: false
            referencedRelation: "lab_test_types"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_test_types: {
        Row: {
          category: string
          code: string
          critical_high: number | null
          critical_low: number | null
          description: string | null
          id: string
          max_normal: number | null
          min_normal: number | null
          name: string
          unit: string
        }
        Insert: {
          category: string
          code: string
          critical_high?: number | null
          critical_low?: number | null
          description?: string | null
          id?: string
          max_normal?: number | null
          min_normal?: number | null
          name: string
          unit: string
        }
        Update: {
          category?: string
          code?: string
          critical_high?: number | null
          critical_low?: number | null
          description?: string | null
          id?: string
          max_normal?: number | null
          min_normal?: number | null
          name?: string
          unit?: string
        }
        Relationships: []
      }
      medical_records: {
        Row: {
          created_at: string
          created_by: string | null
          date: string
          file_url: string | null
          hospital: string | null
          id: string
          notes: string | null
          patient_id: string
          title: string
          type: Database["public"]["Enums"]["record_type"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date: string
          file_url?: string | null
          hospital?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          title: string
          type: Database["public"]["Enums"]["record_type"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date?: string
          file_url?: string | null
          hospital?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          title?: string
          type?: Database["public"]["Enums"]["record_type"]
        }
        Relationships: [
          {
            foreignKeyName: "medical_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_scans: {
        Row: {
          abnormality_score: number | null
          ai_explanation: string | null
          ai_factors: string[] | null
          analyzed_by: string | null
          confidence_score: number | null
          created_at: string
          diagnosis_probability: number | null
          heatmap_url: string | null
          id: string
          image_url: string | null
          inference_time: number | null
          notes: string | null
          patient_id: string
          risk_level: string | null
          scan_type: string
        }
        Insert: {
          abnormality_score?: number | null
          ai_explanation?: string | null
          ai_factors?: string[] | null
          analyzed_by?: string | null
          confidence_score?: number | null
          created_at?: string
          diagnosis_probability?: number | null
          heatmap_url?: string | null
          id?: string
          image_url?: string | null
          inference_time?: number | null
          notes?: string | null
          patient_id: string
          risk_level?: string | null
          scan_type?: string
        }
        Update: {
          abnormality_score?: number | null
          ai_explanation?: string | null
          ai_factors?: string[] | null
          analyzed_by?: string | null
          confidence_score?: number | null
          created_at?: string
          diagnosis_probability?: number | null
          heatmap_url?: string | null
          id?: string
          image_url?: string | null
          inference_time?: number | null
          notes?: string | null
          patient_id?: string
          risk_level?: string | null
          scan_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_scans_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          patient_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          patient_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          patient_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address: string | null
          age: number
          allergies: string[] | null
          approval_status: string
          avatar_url: string | null
          blood_group: string
          chronic_conditions: string[] | null
          created_at: string
          created_by: string | null
          date_of_birth: string | null
          email: string | null
          emergency_contact: string
          gender: Database["public"]["Enums"]["gender_type"]
          id: string
          name: string
          patient_id: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          age: number
          allergies?: string[] | null
          approval_status?: string
          avatar_url?: string | null
          blood_group: string
          chronic_conditions?: string[] | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          email?: string | null
          emergency_contact: string
          gender: Database["public"]["Enums"]["gender_type"]
          id?: string
          name: string
          patient_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          age?: number
          allergies?: string[] | null
          approval_status?: string
          avatar_url?: string | null
          blood_group?: string
          chronic_conditions?: string[] | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          email?: string | null
          emergency_contact?: string
          gender?: Database["public"]["Enums"]["gender_type"]
          id?: string
          name?: string
          patient_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          email: string
          full_name: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email: string
          full_name: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string
          full_name?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scan_annotations: {
        Row: {
          annotation_type: string
          color: string | null
          content: string | null
          created_at: string
          height: number | null
          id: string
          scan_id: string
          updated_at: string
          user_id: string
          width: number | null
          x_position: number
          y_position: number
        }
        Insert: {
          annotation_type?: string
          color?: string | null
          content?: string | null
          created_at?: string
          height?: number | null
          id?: string
          scan_id: string
          updated_at?: string
          user_id: string
          width?: number | null
          x_position: number
          y_position: number
        }
        Update: {
          annotation_type?: string
          color?: string | null
          content?: string | null
          created_at?: string
          height?: number | null
          id?: string
          scan_id?: string
          updated_at?: string
          user_id?: string
          width?: number | null
          x_position?: number
          y_position?: number
        }
        Relationships: [
          {
            foreignKeyName: "scan_annotations_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "medical_scans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vitals: {
        Row: {
          blood_pressure_diastolic: number | null
          blood_pressure_systolic: number | null
          heart_rate: number | null
          id: string
          notes: string | null
          patient_id: string
          recorded_at: string
          recorded_by: string | null
          respiratory_rate: number | null
          smoking_history: boolean | null
          spo2: number | null
          temperature: number | null
        }
        Insert: {
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          heart_rate?: number | null
          id?: string
          notes?: string | null
          patient_id: string
          recorded_at?: string
          recorded_by?: string | null
          respiratory_rate?: number | null
          smoking_history?: boolean | null
          spo2?: number | null
          temperature?: number | null
        }
        Update: {
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          heart_rate?: number | null
          id?: string
          notes?: string | null
          patient_id?: string
          recorded_at?: string
          recorded_by?: string | null
          respiratory_rate?: number | null
          smoking_history?: boolean | null
          spo2?: number | null
          temperature?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vitals_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "doctor" | "nurse" | "patient"
      gender_type: "male" | "female" | "other"
      record_type:
        | "discharge_summary"
        | "diagnosis"
        | "xray_report"
        | "ct_report"
        | "prescription"
        | "lab_result"
        | "mri_report"
        | "ultrasound_report"
        | "blood_test"
        | "ecg_report"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["doctor", "nurse", "patient"],
      gender_type: ["male", "female", "other"],
      record_type: [
        "discharge_summary",
        "diagnosis",
        "xray_report",
        "ct_report",
        "prescription",
        "lab_result",
        "mri_report",
        "ultrasound_report",
        "blood_test",
        "ecg_report",
      ],
    },
  },
} as const
