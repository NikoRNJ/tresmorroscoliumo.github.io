export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      cabin: {
        Row: {
          id: string;
          slug: string;
          name: string;
          headline: string | null;
          description: string | null;
          nightly_rate: number;
          jacuzzi_rate: number;
          max_guests: number;
          area_m2: number | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          headline?: string | null;
          description?: string | null;
          nightly_rate: number;
          jacuzzi_rate: number;
          max_guests: number;
          area_m2?: number | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          headline?: string | null;
          description?: string | null;
          nightly_rate?: number;
          jacuzzi_rate?: number;
          max_guests?: number;
          area_m2?: number | null;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      cabin_image: {
        Row: {
          id: string;
          cabin_id: string;
          url: string;
          caption: string | null;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          cabin_id: string;
          url: string;
          caption?: string | null;
          position?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          cabin_id?: string;
          url?: string;
          caption?: string | null;
          position?: number;
          created_at?: string;
        };
      };
      booking: {
        Row: {
          id: string;
          cabin_id: string;
          cabin_slug: string;
          user_id: string | null;
          guest_name: string;
          guest_email: string;
          guest_phone: string | null;
          party_size: number;
          include_jacuzzi: boolean;
          start_date: string;
          end_date: string;
          amount_total: number;
          amount_breakdown: Json | null;
          status: string;
          currency: string;
          expires_at: string | null;
          flow_order_id: string | null;
          flow_token: string | null;
          created_at: string;
          updated_at: string | null;
          paid_at: string | null;
        };
        Insert: {
          id?: string;
          cabin_id: string;
          cabin_slug: string;
          user_id?: string | null;
          guest_name: string;
          guest_email: string;
          guest_phone?: string | null;
          party_size: number;
          include_jacuzzi?: boolean;
          start_date: string;
          end_date: string;
          amount_total: number;
          amount_breakdown?: Json | null;
          status?: string;
          currency?: string;
          expires_at?: string | null;
          flow_order_id?: string | null;
          flow_token?: string | null;
          created_at?: string;
          updated_at?: string | null;
          paid_at?: string | null;
        };
        Update: {
          id?: string;
          cabin_id?: string;
          cabin_slug?: string;
          user_id?: string | null;
          guest_name?: string;
          guest_email?: string;
          guest_phone?: string | null;
          party_size?: number;
          include_jacuzzi?: boolean;
          start_date?: string;
          end_date?: string;
          amount_total?: number;
          amount_breakdown?: Json | null;
          status?: string;
          currency?: string;
          expires_at?: string | null;
          flow_order_id?: string | null;
          flow_token?: string | null;
          created_at?: string;
          updated_at?: string | null;
          paid_at?: string | null;
        };
      };
      admin_block: {
        Row: {
          id: string;
          cabin_id: string;
          cabin_slug: string;
          start_date: string;
          end_date: string;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          cabin_id: string;
          cabin_slug: string;
          start_date: string;
          end_date: string;
          reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          cabin_id?: string;
          cabin_slug?: string;
          start_date?: string;
          end_date?: string;
          reason?: string | null;
          created_at?: string;
        };
      };
      price_calendar: {
        Row: {
          id: string;
          cabin_id: string;
          cabin_slug: string;
          date: string;
          nightly_rate: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          cabin_id: string;
          cabin_slug: string;
          date: string;
          nightly_rate: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          cabin_id?: string;
          cabin_slug?: string;
          date?: string;
          nightly_rate?: number;
          created_at?: string;
        };
      };
      user: {
        Row: {
          id: string;
          role: "guest" | "admin";
          created_at: string;
        };
        Insert: {
          id: string;
          role?: "guest" | "admin";
          created_at?: string;
        };
        Update: {
          id?: string;
          role?: "guest" | "admin";
          created_at?: string;
        };
      };
    };
  };
};

export type Tables<
  T extends keyof Database["public"]["Tables"]
> = Database["public"]["Tables"][T]["Row"];
