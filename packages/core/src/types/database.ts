/**
 * TIPOS GENERADOS DESDE SUPABASE
 * 
 * Este archivo define los tipos de TypeScript basados en el schema de Supabase.
 * 
 * NOTA: Los datos de las cabañas han sido actualizados:
 * - Capacidad: 7 personas (todas las cabañas)
 * - Precio base: $55.000 CLP por día
 * - Jacuzzi: $25.000 CLP por día
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      cabins: {
        Row: {
          id: string;
          slug: string;
          title: string;
          description: string | null;
          capacity_base: number;
          capacity_max: number;
          base_price: number;
          price_per_extra_person: number;
          jacuzzi_price: number;
          amenities: Json;
          location_details: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          description?: string | null;
          capacity_base: number;
          capacity_max: number;
          base_price: number;
          price_per_extra_person?: number;
          jacuzzi_price?: number;
          amenities?: Json;
          location_details?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          description?: string | null;
          capacity_base?: number;
          capacity_max?: number;
          base_price?: number;
          price_per_extra_person?: number;
          jacuzzi_price?: number;
          amenities?: Json;
          location_details?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      cabin_images: {
        Row: {
          id: string;
          cabin_id: string;
          image_url: string;
          alt_text: string | null;
          sort_order: number;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          cabin_id: string;
          image_url: string;
          alt_text?: string | null;
          sort_order?: number;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          cabin_id?: string;
          image_url?: string;
          alt_text?: string | null;
          sort_order?: number;
          is_primary?: boolean;
          created_at?: string;
        };
      };
      bookings: {
        Row: {
          id: string;
          cabin_id: string;
          start_date: string;
          end_date: string;
          nights: number;
          arrival_time: string;
          departure_time: string;
          party_size: number;
          jacuzzi_days: Json;
          status: 'pending' | 'paid' | 'expired' | 'canceled';
          towels_count: number;
          amount_towels: number;
          flow_order_id: string | null;
          flow_payment_data: Json | null;
          amount_base: number;
          amount_extra_people: number;
          amount_jacuzzi: number;
          amount_total: number;
          customer_name: string;
          customer_email: string;
          customer_phone: string;
          customer_notes: string | null;
          created_at: string;
          expires_at: string | null;
          paid_at: string | null;
          canceled_at: string | null;
          confirmation_sent_at: string | null;
        };
        Insert: {
          id?: string;
          cabin_id: string;
          start_date: string;
          end_date: string;
          party_size: number;
          arrival_time?: string;
          departure_time?: string;
          jacuzzi_days?: Json;
          status?: 'pending' | 'paid' | 'expired' | 'canceled';
          towels_count?: number;
          amount_towels?: number;
          flow_order_id?: string | null;
          flow_payment_data?: Json | null;
          amount_base: number;
          amount_extra_people?: number;
          amount_jacuzzi?: number;
          amount_total: number;
          customer_name: string;
          customer_email: string;
          customer_phone: string;
          customer_notes?: string | null;
          created_at?: string;
          expires_at?: string | null;
          paid_at?: string | null;
          canceled_at?: string | null;
          confirmation_sent_at?: string | null;
        };
        Update: {
          id?: string;
          cabin_id?: string;
          start_date?: string;
          end_date?: string;
          party_size?: number;
          arrival_time?: string;
          departure_time?: string;
          jacuzzi_days?: Json;
          status?: 'pending' | 'paid' | 'expired' | 'canceled';
          towels_count?: number;
          amount_towels?: number;
          flow_order_id?: string | null;
          flow_payment_data?: Json | null;
          amount_base?: number;
          amount_extra_people?: number;
          amount_jacuzzi?: number;
          amount_total?: number;
          customer_name?: string;
          customer_email?: string;
          customer_phone?: string;
          customer_notes?: string | null;
          created_at?: string;
          expires_at?: string | null;
          paid_at?: string | null;
          canceled_at?: string | null;
          confirmation_sent_at?: string | null;
        };
      };
      admin_blocks: {
        Row: {
          id: string;
          cabin_id: string;
          start_date: string;
          end_date: string;
          reason: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          cabin_id: string;
          start_date: string;
          end_date: string;
          reason?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          cabin_id?: string;
          start_date?: string;
          end_date?: string;
          reason?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
      };
      api_events: {
        Row: {
          id: string;
          event_type: string;
          event_source: string;
          booking_id: string | null;
          payload: Json | null;
          status: string | null;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_type: string;
          event_source: string;
          booking_id?: string | null;
          payload?: Json | null;
          status?: string | null;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_type?: string;
          event_source?: string;
          booking_id?: string | null;
          payload?: Json | null;
          status?: string | null;
          error_message?: string | null;
          created_at?: string;
        };
      };
      galeria: {
        Row: {
          id: string;
          image_url: string;
          storage_path: string | null;
          category: string;
          position: number;
          alt_text: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          image_url: string;
          storage_path?: string | null;
          category: string;
          position?: number;
          alt_text?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          image_url?: string;
          storage_path?: string | null;
          category?: string;
          position?: number;
          alt_text?: string | null;
          created_at?: string;
        };
      };
      site_visits: {
        Row: {
          id: string;
          ip_hash: string;
          path: string;
          device_type: string | null;
          referrer: string | null;
          country: string | null;
          visited_at: string;
          visit_date: string;
        };
        Insert: {
          id?: string;
          ip_hash: string;
          path?: string;
          device_type?: string | null;
          referrer?: string | null;
          country?: string | null;
          visited_at?: string;
          visit_date?: string;
        };
        Update: {
          id?: string;
          ip_hash?: string;
          path?: string;
          device_type?: string | null;
          referrer?: string | null;
          country?: string | null;
          visited_at?: string;
          visit_date?: string;
        };
      };
    };
  };
}

// Tipos auxiliares útiles
export type Cabin = Database['public']['Tables']['cabins']['Row'];
export type CabinInsert = Database['public']['Tables']['cabins']['Insert'];
export type CabinUpdate = Database['public']['Tables']['cabins']['Update'];

export type Booking = Database['public']['Tables']['bookings']['Row'];
export type BookingInsert = Database['public']['Tables']['bookings']['Insert'];
export type BookingUpdate = Database['public']['Tables']['bookings']['Update'];
export type BookingStatus = Booking['status'];

export type CabinImage = Database['public']['Tables']['cabin_images']['Row'];
export type AdminBlock = Database['public']['Tables']['admin_blocks']['Row'];
export type ApiEvent = Database['public']['Tables']['api_events']['Row'];

export type Galeria = Database['public']['Tables']['galeria']['Row'];
export type GaleriaInsert = Database['public']['Tables']['galeria']['Insert'];
export type GaleriaUpdate = Database['public']['Tables']['galeria']['Update'];

export type SiteVisit = Database['public']['Tables']['site_visits']['Row'];
export type SiteVisitInsert = Database['public']['Tables']['site_visits']['Insert'];
export type SiteVisitUpdate = Database['public']['Tables']['site_visits']['Update'];
