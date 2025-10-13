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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      attachments: {
        Row: {
          created_at: string | null
          entidad: string
          entidad_id: string
          id: string
          nombre_archivo: string | null
          tamanio_bytes: number | null
          tipo_archivo: string | null
          uploaded_by: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          entidad: string
          entidad_id: string
          id?: string
          nombre_archivo?: string | null
          tamanio_bytes?: number | null
          tipo_archivo?: string | null
          uploaded_by?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          entidad?: string
          entidad_id?: string
          id?: string
          nombre_archivo?: string | null
          tamanio_bytes?: number | null
          tipo_archivo?: string | null
          uploaded_by?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          accion: string
          datos_anteriores: Json | null
          datos_nuevos: Json | null
          id: string
          registro_id: string
          tabla: string
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          accion: string
          datos_anteriores?: Json | null
          datos_nuevos?: Json | null
          id?: string
          registro_id: string
          tabla: string
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          accion?: string
          datos_anteriores?: Json | null
          datos_nuevos?: Json | null
          id?: string
          registro_id?: string
          tabla?: string
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          activa: boolean | null
          codigo: string
          created_at: string | null
          direccion: string | null
          email: string | null
          id: string
          nombre: string
          telefono: string | null
          updated_at: string | null
        }
        Insert: {
          activa?: boolean | null
          codigo: string
          created_at?: string | null
          direccion?: string | null
          email?: string | null
          id?: string
          nombre: string
          telefono?: string | null
          updated_at?: string | null
        }
        Update: {
          activa?: boolean | null
          codigo?: string
          created_at?: string | null
          direccion?: string | null
          email?: string | null
          id?: string
          nombre?: string
          telefono?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      client_addresses: {
        Row: {
          alias: string | null
          ciudad: string
          client_id: string
          codigo_postal: string | null
          comuna: string
          created_at: string | null
          direccion: string
          es_predeterminada: boolean | null
          id: string
          latitud: number | null
          longitud: number | null
          region: string
        }
        Insert: {
          alias?: string | null
          ciudad: string
          client_id: string
          codigo_postal?: string | null
          comuna: string
          created_at?: string | null
          direccion: string
          es_predeterminada?: boolean | null
          id?: string
          latitud?: number | null
          longitud?: number | null
          region: string
        }
        Update: {
          alias?: string | null
          ciudad?: string
          client_id?: string
          codigo_postal?: string | null
          comuna?: string
          created_at?: string | null
          direccion?: string
          es_predeterminada?: boolean | null
          id?: string
          latitud?: number | null
          longitud?: number | null
          region?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_addresses_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_contacts: {
        Row: {
          cargo: string | null
          client_id: string
          created_at: string | null
          email: string | null
          es_principal: boolean | null
          id: string
          nombre: string
          phone: string | null
        }
        Insert: {
          cargo?: string | null
          client_id: string
          created_at?: string | null
          email?: string | null
          es_principal?: boolean | null
          id?: string
          nombre: string
          phone?: string | null
        }
        Update: {
          cargo?: string | null
          client_id?: string
          created_at?: string | null
          email?: string | null
          es_principal?: boolean | null
          id?: string
          nombre?: string
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          branch_id: string | null
          created_at: string | null
          dv: string | null
          email_principal: string | null
          emails: string[] | null
          estado: Database["public"]["Enums"]["client_status"] | null
          giro: string | null
          id: string
          nombre_comercial: string | null
          notas: string | null
          pasaporte: string | null
          razon_social: string | null
          rut: string | null
          telefonos: string[] | null
          tipo: Database["public"]["Enums"]["client_type"]
          updated_at: string | null
          vendedor_id: string | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string | null
          dv?: string | null
          email_principal?: string | null
          emails?: string[] | null
          estado?: Database["public"]["Enums"]["client_status"] | null
          giro?: string | null
          id?: string
          nombre_comercial?: string | null
          notas?: string | null
          pasaporte?: string | null
          razon_social?: string | null
          rut?: string | null
          telefonos?: string[] | null
          tipo: Database["public"]["Enums"]["client_type"]
          updated_at?: string | null
          vendedor_id?: string | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string | null
          dv?: string | null
          email_principal?: string | null
          emails?: string[] | null
          estado?: Database["public"]["Enums"]["client_status"] | null
          giro?: string | null
          id?: string
          nombre_comercial?: string | null
          notas?: string | null
          pasaporte?: string | null
          razon_social?: string | null
          rut?: string | null
          telefonos?: string[] | null
          tipo?: Database["public"]["Enums"]["client_type"]
          updated_at?: string | null
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      counters: {
        Row: {
          anio: number
          clave: string
          created_at: string | null
          id: string
          secuencia: number | null
        }
        Insert: {
          anio: number
          clave: string
          created_at?: string | null
          id?: string
          secuencia?: number | null
        }
        Update: {
          anio?: number
          clave?: string
          created_at?: string | null
          id?: string
          secuencia?: number | null
        }
        Relationships: []
      }
      invitations: {
        Row: {
          branch_id: string | null
          created_at: string | null
          email: string
          estado: Database["public"]["Enums"]["invitation_status"] | null
          expira_at: string
          id: string
          invitado_por: string | null
          rol: Database["public"]["Enums"]["app_role"]
          token: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string | null
          email: string
          estado?: Database["public"]["Enums"]["invitation_status"] | null
          expira_at: string
          id?: string
          invitado_por?: string | null
          rol: Database["public"]["Enums"]["app_role"]
          token: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string | null
          email?: string
          estado?: Database["public"]["Enums"]["invitation_status"] | null
          expira_at?: string
          id?: string
          invitado_por?: string | null
          rol?: Database["public"]["Enums"]["app_role"]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_invitado_por_fkey"
            columns: ["invitado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          canal: Database["public"]["Enums"]["notification_channel"]
          created_at: string | null
          destinatario: string
          enviado_at: string | null
          estado: Database["public"]["Enums"]["notification_status"] | null
          evento: string
          id: string
          payload: Json | null
          plantilla: string
        }
        Insert: {
          canal: Database["public"]["Enums"]["notification_channel"]
          created_at?: string | null
          destinatario: string
          enviado_at?: string | null
          estado?: Database["public"]["Enums"]["notification_status"] | null
          evento: string
          id?: string
          payload?: Json | null
          plantilla: string
        }
        Update: {
          canal?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string | null
          destinatario?: string
          enviado_at?: string | null
          estado?: Database["public"]["Enums"]["notification_status"] | null
          evento?: string
          id?: string
          payload?: Json | null
          plantilla?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          activo: boolean | null
          aplica_iva: boolean | null
          created_at: string | null
          id: string
          nombre: string
          precio_costo: number | null
          precio_venta: number | null
          serializable: boolean | null
          sku: string
          stock_minimo: number | null
          supplier_id: string | null
          tipo: string | null
          unidad_medida: string | null
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          aplica_iva?: boolean | null
          created_at?: string | null
          id?: string
          nombre: string
          precio_costo?: number | null
          precio_venta?: number | null
          serializable?: boolean | null
          sku: string
          stock_minimo?: number | null
          supplier_id?: string | null
          tipo?: string | null
          unidad_medida?: string | null
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          aplica_iva?: boolean | null
          created_at?: string | null
          id?: string
          nombre?: string
          precio_costo?: number | null
          precio_venta?: number | null
          serializable?: boolean | null
          sku?: string
          stock_minimo?: number | null
          supplier_id?: string | null
          tipo?: string | null
          unidad_medida?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          apellido: string | null
          branch_id: string | null
          created_at: string | null
          email: string
          estado: boolean | null
          id: string
          nombre: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          apellido?: string | null
          branch_id?: string | null
          created_at?: string | null
          email: string
          estado?: boolean | null
          id: string
          nombre: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          apellido?: string | null
          branch_id?: string | null
          created_at?: string | null
          email?: string
          estado?: boolean | null
          id?: string
          nombre?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_approval_tokens: {
        Row: {
          created_at: string | null
          expira_at: string
          id: string
          quote_id: string
          token: string
          usado: boolean | null
          usado_at: string | null
        }
        Insert: {
          created_at?: string | null
          expira_at?: string
          id?: string
          quote_id: string
          token: string
          usado?: boolean | null
          usado_at?: string | null
        }
        Update: {
          created_at?: string | null
          expira_at?: string
          id?: string
          quote_id?: string
          token?: string
          usado?: boolean | null
          usado_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_approval_tokens_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_items: {
        Row: {
          cantidad: number
          created_at: string | null
          descripcion: string | null
          descuento_porcentaje: number | null
          id: string
          item_tipo: string
          nombre: string
          precio_unitario: number
          quote_id: string
          ref_id: string | null
          subtotal: number
        }
        Insert: {
          cantidad?: number
          created_at?: string | null
          descripcion?: string | null
          descuento_porcentaje?: number | null
          id?: string
          item_tipo: string
          nombre: string
          precio_unitario: number
          quote_id: string
          ref_id?: string | null
          subtotal: number
        }
        Update: {
          cantidad?: number
          created_at?: string | null
          descripcion?: string | null
          descuento_porcentaje?: number | null
          id?: string
          item_tipo?: string
          nombre?: string
          precio_unitario?: number
          quote_id?: string
          ref_id?: string | null
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          branch_id: string
          client_id: string
          created_at: string | null
          estado: Database["public"]["Enums"]["quote_status"] | null
          fecha_emision: string | null
          folio: string
          id: string
          iva: number | null
          neto: number | null
          notas: string | null
          pdf_url: string | null
          total: number | null
          updated_at: string | null
          validez_dias: number | null
          vendedor_id: string
        }
        Insert: {
          branch_id: string
          client_id: string
          created_at?: string | null
          estado?: Database["public"]["Enums"]["quote_status"] | null
          fecha_emision?: string | null
          folio: string
          id?: string
          iva?: number | null
          neto?: number | null
          notas?: string | null
          pdf_url?: string | null
          total?: number | null
          updated_at?: string | null
          validez_dias?: number | null
          vendedor_id: string
        }
        Update: {
          branch_id?: string
          client_id?: string
          created_at?: string | null
          estado?: Database["public"]["Enums"]["quote_status"] | null
          fecha_emision?: string | null
          folio?: string
          id?: string
          iva?: number | null
          neto?: number | null
          notas?: string | null
          pdf_url?: string | null
          total?: number | null
          updated_at?: string | null
          validez_dias?: number | null
          vendedor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          activo: boolean | null
          created_at: string | null
          descripcion: string | null
          id: string
          nombre: string
          precio_base: number
          requiere_checklist: boolean | null
          tiempo_estimado_minutos: number | null
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre: string
          precio_base: number
          requiere_checklist?: boolean | null
          tiempo_estimado_minutos?: number | null
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre?: string
          precio_base?: number
          requiere_checklist?: boolean | null
          tiempo_estimado_minutos?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      services_products: {
        Row: {
          cantidad: number
          created_at: string | null
          id: string
          product_id: string
          service_id: string
        }
        Insert: {
          cantidad?: number
          created_at?: string | null
          id?: string
          product_id: string
          service_id: string
        }
        Update: {
          cantidad?: number
          created_at?: string | null
          id?: string
          product_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_products_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          clave: string
          descripcion: string | null
          id: string
          tipo_dato: string | null
          updated_at: string | null
          valor: string
        }
        Insert: {
          clave: string
          descripcion?: string | null
          id?: string
          tipo_dato?: string | null
          updated_at?: string | null
          valor: string
        }
        Update: {
          clave?: string
          descripcion?: string | null
          id?: string
          tipo_dato?: string | null
          updated_at?: string | null
          valor?: string
        }
        Relationships: []
      }
      stock_locations: {
        Row: {
          activa: boolean | null
          branch_id: string | null
          codigo: string
          created_at: string | null
          id: string
          nombre: string
          tipo: Database["public"]["Enums"]["stock_location_type"]
        }
        Insert: {
          activa?: boolean | null
          branch_id?: string | null
          codigo: string
          created_at?: string | null
          id?: string
          nombre: string
          tipo: Database["public"]["Enums"]["stock_location_type"]
        }
        Update: {
          activa?: boolean | null
          branch_id?: string | null
          codigo?: string
          created_at?: string | null
          id?: string
          nombre?: string
          tipo?: Database["public"]["Enums"]["stock_location_type"]
        }
        Relationships: [
          {
            foreignKeyName: "stock_locations_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_moves: {
        Row: {
          cantidad: number
          created_at: string | null
          fecha: string | null
          from_location_id: string | null
          id: string
          notas: string | null
          product_id: string
          referencia: string | null
          tipo: Database["public"]["Enums"]["stock_move_type"]
          to_location_id: string | null
          user_id: string | null
        }
        Insert: {
          cantidad: number
          created_at?: string | null
          fecha?: string | null
          from_location_id?: string | null
          id?: string
          notas?: string | null
          product_id: string
          referencia?: string | null
          tipo: Database["public"]["Enums"]["stock_move_type"]
          to_location_id?: string | null
          user_id?: string | null
        }
        Update: {
          cantidad?: number
          created_at?: string | null
          fecha?: string | null
          from_location_id?: string | null
          id?: string
          notas?: string | null
          product_id?: string
          referencia?: string | null
          tipo?: Database["public"]["Enums"]["stock_move_type"]
          to_location_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_moves_from_location_id_fkey"
            columns: ["from_location_id"]
            isOneToOne: false
            referencedRelation: "stock_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_moves_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_moves_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_moves_to_location_id_fkey"
            columns: ["to_location_id"]
            isOneToOne: false
            referencedRelation: "stock_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_moves_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_events: {
        Row: {
          fecha: string | null
          id: string
          notas: string | null
          subscription_id: string
          tipo: string
          user_id: string | null
        }
        Insert: {
          fecha?: string | null
          id?: string
          notas?: string | null
          subscription_id: string
          tipo: string
          user_id?: string | null
        }
        Update: {
          fecha?: string | null
          id?: string
          notas?: string | null
          subscription_id?: string
          tipo?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_events_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          activo: boolean | null
          created_at: string | null
          descripcion: string | null
          dias_gracia: number | null
          id: string
          nombre: string
          periodo_meses: number
          precio: number
          suspension_automatica: boolean | null
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          dias_gracia?: number | null
          id?: string
          nombre: string
          periodo_meses: number
          precio: number
          suspension_automatica?: boolean | null
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          dias_gracia?: number | null
          id?: string
          nombre?: string
          periodo_meses?: number
          precio?: number
          suspension_automatica?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          client_id: string
          created_at: string | null
          estado: Database["public"]["Enums"]["subscription_status"] | null
          fecha_inicio: string
          fecha_vencimiento: string
          folio: string
          id: string
          notas: string | null
          plan_id: string
          updated_at: string | null
          vehicle_id: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          estado?: Database["public"]["Enums"]["subscription_status"] | null
          fecha_inicio: string
          fecha_vencimiento: string
          folio: string
          id?: string
          notas?: string | null
          plan_id: string
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          estado?: Database["public"]["Enums"]["subscription_status"] | null
          fecha_inicio?: string
          fecha_vencimiento?: string
          folio?: string
          id?: string
          notas?: string | null
          plan_id?: string
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          activo: boolean | null
          condicion_pago: string | null
          created_at: string | null
          dv: string
          email: string | null
          id: string
          lead_time_dias: number | null
          moneda: string | null
          razon_social: string
          rut: string
          telefono: string | null
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          condicion_pago?: string | null
          created_at?: string | null
          dv: string
          email?: string | null
          id?: string
          lead_time_dias?: number | null
          moneda?: string | null
          razon_social: string
          rut: string
          telefono?: string | null
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          condicion_pago?: string | null
          created_at?: string | null
          dv?: string
          email?: string | null
          id?: string
          lead_time_dias?: number | null
          moneda?: string | null
          razon_social?: string
          rut?: string
          telefono?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          anio: number | null
          client_id: string
          color: string | null
          combustible: string | null
          created_at: string | null
          id: string
          marca: string
          modelo: string
          notas: string | null
          numero_motor: string | null
          odometro: number | null
          patente: string
          updated_at: string | null
          vin: string | null
        }
        Insert: {
          anio?: number | null
          client_id: string
          color?: string | null
          combustible?: string | null
          created_at?: string | null
          id?: string
          marca: string
          modelo: string
          notas?: string | null
          numero_motor?: string | null
          odometro?: number | null
          patente: string
          updated_at?: string | null
          vin?: string | null
        }
        Update: {
          anio?: number | null
          client_id?: string
          color?: string | null
          combustible?: string | null
          created_at?: string | null
          id?: string
          marca?: string
          modelo?: string
          notas?: string | null
          numero_motor?: string | null
          odometro?: number | null
          patente?: string
          updated_at?: string | null
          vin?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      wo_items: {
        Row: {
          cantidad: number
          created_at: string | null
          id: string
          item_tipo: string
          nombre: string
          precio_unitario: number | null
          ref_id: string | null
          wo_id: string
        }
        Insert: {
          cantidad?: number
          created_at?: string | null
          id?: string
          item_tipo: string
          nombre: string
          precio_unitario?: number | null
          ref_id?: string | null
          wo_id: string
        }
        Update: {
          cantidad?: number
          created_at?: string | null
          id?: string
          item_tipo?: string
          nombre?: string
          precio_unitario?: number | null
          ref_id?: string | null
          wo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wo_items_wo_id_fkey"
            columns: ["wo_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      work_orders: {
        Row: {
          branch_id: string
          client_id: string
          created_at: string | null
          direccion_id: string | null
          estado: Database["public"]["Enums"]["wo_status"] | null
          fecha_programada: string | null
          folio: string
          id: string
          notas: string | null
          tecnico_id: string | null
          ubicacion_manual: string | null
          updated_at: string | null
          vehicle_id: string | null
          ventana_fin: string | null
          ventana_inicio: string | null
        }
        Insert: {
          branch_id: string
          client_id: string
          created_at?: string | null
          direccion_id?: string | null
          estado?: Database["public"]["Enums"]["wo_status"] | null
          fecha_programada?: string | null
          folio: string
          id?: string
          notas?: string | null
          tecnico_id?: string | null
          ubicacion_manual?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
          ventana_fin?: string | null
          ventana_inicio?: string | null
        }
        Update: {
          branch_id?: string
          client_id?: string
          created_at?: string | null
          direccion_id?: string | null
          estado?: Database["public"]["Enums"]["wo_status"] | null
          fecha_programada?: string | null
          folio?: string
          id?: string
          notas?: string | null
          tecnico_id?: string | null
          ubicacion_manual?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
          ventana_fin?: string | null
          ventana_inicio?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_direccion_id_fkey"
            columns: ["direccion_id"]
            isOneToOne: false
            referencedRelation: "client_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_tecnico_id_fkey"
            columns: ["tecnico_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      products_public: {
        Row: {
          activo: boolean | null
          aplica_iva: boolean | null
          created_at: string | null
          id: string | null
          nombre: string | null
          precio_venta: number | null
          serializable: boolean | null
          sku: string | null
          stock_minimo: number | null
          supplier_id: string | null
          tipo: string | null
          unidad_medida: string | null
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          aplica_iva?: boolean | null
          created_at?: string | null
          id?: string | null
          nombre?: string | null
          precio_venta?: number | null
          serializable?: boolean | null
          sku?: string | null
          stock_minimo?: number | null
          supplier_id?: string | null
          tipo?: string | null
          unidad_medida?: string | null
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          aplica_iva?: boolean | null
          created_at?: string | null
          id?: string | null
          nombre?: string | null
          precio_venta?: number | null
          serializable?: boolean | null
          sku?: string | null
          stock_minimo?: number | null
          supplier_id?: string | null
          tipo?: string | null
          unidad_medida?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      expirar_cotizaciones_vencidas: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generar_folio: {
        Args: { prefijo: string }
        Returns: string
      }
      generar_token_aprobacion: {
        Args: { quote_id_param: string }
        Returns: string
      }
      get_user_branch: {
        Args: { _user_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      search_clients: {
        Args: { search_term: string }
        Returns: {
          client_id: string
          relevance: number
        }[]
      }
      search_vehicles: {
        Args: { search_term: string }
        Returns: {
          relevance: number
          vehicle_id: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "operador" | "tecnico" | "vendedor" | "cliente"
      client_status: "prospecto" | "activo" | "mora" | "suspendido"
      client_type: "empresa" | "persona"
      invitation_status: "pendiente" | "aceptada" | "expirada"
      notification_channel: "email" | "sms" | "whatsapp"
      notification_status: "pendiente" | "enviado" | "fallido"
      quote_status:
        | "borrador"
        | "enviada"
        | "aceptada"
        | "rechazada"
        | "expirada"
      stock_location_type: "bodega" | "camioneta"
      stock_move_type:
        | "compra"
        | "traslado"
        | "reserva"
        | "consumo"
        | "devolucion"
        | "ajuste"
      subscription_status: "activa" | "mora" | "suspendida" | "cancelada"
      wo_status:
        | "programada"
        | "en_ruta"
        | "en_proceso"
        | "completada"
        | "cancelada"
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
      app_role: ["admin", "operador", "tecnico", "vendedor", "cliente"],
      client_status: ["prospecto", "activo", "mora", "suspendido"],
      client_type: ["empresa", "persona"],
      invitation_status: ["pendiente", "aceptada", "expirada"],
      notification_channel: ["email", "sms", "whatsapp"],
      notification_status: ["pendiente", "enviado", "fallido"],
      quote_status: [
        "borrador",
        "enviada",
        "aceptada",
        "rechazada",
        "expirada",
      ],
      stock_location_type: ["bodega", "camioneta"],
      stock_move_type: [
        "compra",
        "traslado",
        "reserva",
        "consumo",
        "devolucion",
        "ajuste",
      ],
      subscription_status: ["activa", "mora", "suspendida", "cancelada"],
      wo_status: [
        "programada",
        "en_ruta",
        "en_proceso",
        "completada",
        "cancelada",
      ],
    },
  },
} as const
