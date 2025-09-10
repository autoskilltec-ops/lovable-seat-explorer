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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      bus_seats: {
        Row: {
          bus_id: string | null
          created_at: string | null
          id: string
          reserved_until: string | null
          seat_number: number
          status: Database["public"]["Enums"]["seat_status"] | null
          trip_id: string
        }
        Insert: {
          bus_id?: string | null
          created_at?: string | null
          id?: string
          reserved_until?: string | null
          seat_number: number
          status?: Database["public"]["Enums"]["seat_status"] | null
          trip_id: string
        }
        Update: {
          bus_id?: string | null
          created_at?: string | null
          id?: string
          reserved_until?: string | null
          seat_number?: number
          status?: Database["public"]["Enums"]["seat_status"] | null
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bus_seats_bus_id_fkey"
            columns: ["bus_id"]
            isOneToOne: false
            referencedRelation: "buses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bus_seats_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      buses: {
        Row: {
          bus_number: number
          created_at: string | null
          id: string
          trip_id: string
        }
        Insert: {
          bus_number: number
          created_at?: string | null
          id?: string
          trip_id: string
        }
        Update: {
          bus_number?: number
          created_at?: string | null
          id?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "buses_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      destinations: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          name: string
          state: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          state: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          state?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          id: string
          installments: number | null
          method: Database["public"]["Enums"]["payment_method"]
          payment_method_preference: Database["public"]["Enums"]["payment_preference"]
          pix_payload: string | null
          reservation_id: string
          status: Database["public"]["Enums"]["payment_status"] | null
          stripe_session_id: string | null
          transacao_ref: string | null
          updated_at: string | null
          whatsapp_sent_at: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          installments?: number | null
          method: Database["public"]["Enums"]["payment_method"]
          payment_method_preference?: Database["public"]["Enums"]["payment_preference"]
          pix_payload?: string | null
          reservation_id: string
          status?: Database["public"]["Enums"]["payment_status"] | null
          stripe_session_id?: string | null
          transacao_ref?: string | null
          updated_at?: string | null
          whatsapp_sent_at?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          installments?: number | null
          method?: Database["public"]["Enums"]["payment_method"]
          payment_method_preference?: Database["public"]["Enums"]["payment_preference"]
          pix_payload?: string | null
          reservation_id?: string
          status?: Database["public"]["Enums"]["payment_status"] | null
          stripe_session_id?: string | null
          transacao_ref?: string | null
          updated_at?: string | null
          whatsapp_sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reservations: {
        Row: {
          codigo_confirmacao: string
          created_at: string | null
          customer_cpf: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          emergency_contact: string | null
          id: string
          passengers: number
          plan_type: string
          seat_ids: string[] | null
          status: Database["public"]["Enums"]["reservation_status"] | null
          total_amount: number
          trip_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          codigo_confirmacao: string
          created_at?: string | null
          customer_cpf?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          emergency_contact?: string | null
          id?: string
          passengers: number
          plan_type: string
          seat_ids?: string[] | null
          status?: Database["public"]["Enums"]["reservation_status"] | null
          total_amount: number
          trip_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          codigo_confirmacao?: string
          created_at?: string | null
          customer_cpf?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          emergency_contact?: string | null
          id?: string
          passengers?: number
          plan_type?: string
          seat_ids?: string[] | null
          status?: Database["public"]["Enums"]["reservation_status"] | null
          total_amount?: number
          trip_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          bus_quantity: number
          created_at: string | null
          departure_date: string
          destination_id: string
          id: string
          includes_accommodation: boolean | null
          includes_breakfast: boolean | null
          max_seats: number | null
          price_couple: number
          price_group: number
          price_individual: number
          return_date: string
        }
        Insert: {
          bus_quantity?: number
          created_at?: string | null
          departure_date: string
          destination_id: string
          id?: string
          includes_accommodation?: boolean | null
          includes_breakfast?: boolean | null
          max_seats?: number | null
          price_couple: number
          price_group: number
          price_individual: number
          return_date: string
        }
        Update: {
          bus_quantity?: number
          created_at?: string | null
          departure_date?: string
          destination_id?: string
          id?: string
          includes_accommodation?: boolean | null
          includes_breakfast?: boolean | null
          max_seats?: number | null
          price_couple?: number
          price_group?: number
          price_individual?: number
          return_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _free_seats: {
        Args: { seat_ids: string[] }
        Returns: undefined
      }
      clean_expired_seat_holds: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_confirmation_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_trip_buses: {
        Args: { trip_uuid: string }
        Returns: {
          available_seats: number
          bus_id: string
          bus_number: number
          occupied_seats: number
          total_seats: number
        }[]
      }
    }
    Enums: {
      payment_method: "pix" | "cartao"
      payment_preference: "pix" | "cartao_credito" | "cartao_debito"
      payment_status: "iniciado" | "aprovado" | "recusado" | "cancelado"
      reservation_status: "pendente" | "pago" | "cancelado" | '""'
      seat_status: "disponivel" | "reservado_temporario" | "ocupado"
      user_role: "user" | "admin"
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
      payment_method: ["pix", "cartao"],
      payment_preference: ["pix", "cartao_credito", "cartao_debito"],
      payment_status: ["iniciado", "aprovado", "recusado", "cancelado"],
      reservation_status: ["pendente", "pago", "cancelado", '""'],
      seat_status: ["disponivel", "reservado_temporario", "ocupado"],
      user_role: ["user", "admin"],
    },
  },
} as const
