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
          {
            foreignKeyName: "attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "seller_performance"
            referencedColumns: ["vendedor_id"]
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
          {
            foreignKeyName: "audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "seller_performance"
            referencedColumns: ["vendedor_id"]
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
          {
            foreignKeyName: "clients_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "seller_performance"
            referencedColumns: ["vendedor_id"]
          },
        ]
      }
      commission_config: {
        Row: {
          activa: boolean | null
          config: Json
          created_at: string | null
          id: string
          tipo: string
          updated_at: string | null
          vendedor_id: string | null
          vigencia_desde: string
          vigencia_hasta: string | null
        }
        Insert: {
          activa?: boolean | null
          config: Json
          created_at?: string | null
          id?: string
          tipo: string
          updated_at?: string | null
          vendedor_id?: string | null
          vigencia_desde: string
          vigencia_hasta?: string | null
        }
        Update: {
          activa?: boolean | null
          config?: Json
          created_at?: string | null
          id?: string
          tipo?: string
          updated_at?: string | null
          vendedor_id?: string | null
          vigencia_desde?: string
          vigencia_hasta?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commission_config_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_config_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "seller_performance"
            referencedColumns: ["vendedor_id"]
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
          {
            foreignKeyName: "invitations_invitado_por_fkey"
            columns: ["invitado_por"]
            isOneToOne: false
            referencedRelation: "seller_performance"
            referencedColumns: ["vendedor_id"]
          },
        ]
      }
      notification_conditions: {
        Row: {
          activo: boolean | null
          campo: string
          created_at: string | null
          id: string
          operador: string
          template_id: string | null
          valor: string
        }
        Insert: {
          activo?: boolean | null
          campo: string
          created_at?: string | null
          id?: string
          operador: string
          template_id?: string | null
          valor: string
        }
        Update: {
          activo?: boolean | null
          campo?: string
          created_at?: string | null
          id?: string
          operador?: string
          template_id?: string | null
          valor?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_conditions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "notification_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_templates: {
        Row: {
          activa: boolean | null
          asunto: string | null
          body_preview: string | null
          canal: Database["public"]["Enums"]["notification_channel"]
          categoria: string | null
          created_at: string | null
          cuerpo: string
          descripcion: string | null
          evento: string
          html_content: string | null
          id: string
          subject_preview: string | null
          updated_at: string | null
          variables_disponibles: Json | null
        }
        Insert: {
          activa?: boolean | null
          asunto?: string | null
          body_preview?: string | null
          canal: Database["public"]["Enums"]["notification_channel"]
          categoria?: string | null
          created_at?: string | null
          cuerpo: string
          descripcion?: string | null
          evento: string
          html_content?: string | null
          id?: string
          subject_preview?: string | null
          updated_at?: string | null
          variables_disponibles?: Json | null
        }
        Update: {
          activa?: boolean | null
          asunto?: string | null
          body_preview?: string | null
          canal?: Database["public"]["Enums"]["notification_channel"]
          categoria?: string | null
          created_at?: string | null
          cuerpo?: string
          descripcion?: string | null
          evento?: string
          html_content?: string | null
          id?: string
          subject_preview?: string | null
          updated_at?: string | null
          variables_disponibles?: Json | null
        }
        Relationships: []
      }
      notification_variables: {
        Row: {
          categoria: string
          created_at: string | null
          descripcion: string | null
          ejemplo: string | null
          id: string
          tipo_dato: string | null
          variable: string
        }
        Insert: {
          categoria: string
          created_at?: string | null
          descripcion?: string | null
          ejemplo?: string | null
          id?: string
          tipo_dato?: string | null
          variable: string
        }
        Update: {
          categoria?: string
          created_at?: string | null
          descripcion?: string | null
          ejemplo?: string | null
          id?: string
          tipo_dato?: string | null
          variable?: string
        }
        Relationships: []
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
      product_compatibility: {
        Row: {
          estado: string
          id: string
          observaciones: string | null
          product_id: string
          updated_at: string | null
          updated_by: string | null
          vehicle_catalog_id: string
        }
        Insert: {
          estado: string
          id?: string
          observaciones?: string | null
          product_id: string
          updated_at?: string | null
          updated_by?: string | null
          vehicle_catalog_id: string
        }
        Update: {
          estado?: string
          id?: string
          observaciones?: string | null
          product_id?: string
          updated_at?: string | null
          updated_by?: string | null
          vehicle_catalog_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_compatibility_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_compatibility_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_compatibility_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "stock_by_location"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_compatibility_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_compatibility_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "seller_performance"
            referencedColumns: ["vendedor_id"]
          },
          {
            foreignKeyName: "product_compatibility_vehicle_catalog_id_fkey"
            columns: ["vehicle_catalog_id"]
            isOneToOne: false
            referencedRelation: "vehicle_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      product_serials: {
        Row: {
          created_at: string | null
          estado: string | null
          id: string
          location_id: string | null
          notas: string | null
          product_id: string
          serial_number: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          estado?: string | null
          id?: string
          location_id?: string | null
          notas?: string | null
          product_id: string
          serial_number: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          estado?: string | null
          id?: string
          location_id?: string | null
          notas?: string | null
          product_id?: string
          serial_number?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_serials_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "stock_by_location"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "product_serials_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "stock_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_serials_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_serials_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_serials_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "stock_by_location"
            referencedColumns: ["product_id"]
          },
        ]
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
          requiere_suscripcion: boolean | null
          serializable: boolean | null
          sku: string
          stock_minimo: number | null
          supplier_id: string | null
          tipo: string | null
          tipos_suscripcion_disponibles: Json | null
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
          requiere_suscripcion?: boolean | null
          serializable?: boolean | null
          sku: string
          stock_minimo?: number | null
          supplier_id?: string | null
          tipo?: string | null
          tipos_suscripcion_disponibles?: Json | null
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
          requiere_suscripcion?: boolean | null
          serializable?: boolean | null
          sku?: string
          stock_minimo?: number | null
          supplier_id?: string | null
          tipo?: string | null
          tipos_suscripcion_disponibles?: Json | null
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
          estado: Database["public"]["Enums"]["user_status"]
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
          estado?: Database["public"]["Enums"]["user_status"]
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
          estado?: Database["public"]["Enums"]["user_status"]
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
          comprobante_pago_url: string | null
          created_at: string | null
          email_destinatario: string | null
          email_enviado_at: string | null
          estado: Database["public"]["Enums"]["quote_status"] | null
          fecha_emision: string | null
          folio: string
          id: string
          iva: number | null
          metodo_aprobacion: string | null
          neto: number | null
          notas: string | null
          pdf_url: string | null
          total: number | null
          updated_at: string | null
          validez_dias: number | null
          vehicle_id: string | null
          vendedor_id: string
        }
        Insert: {
          branch_id: string
          client_id: string
          comprobante_pago_url?: string | null
          created_at?: string | null
          email_destinatario?: string | null
          email_enviado_at?: string | null
          estado?: Database["public"]["Enums"]["quote_status"] | null
          fecha_emision?: string | null
          folio: string
          id?: string
          iva?: number | null
          metodo_aprobacion?: string | null
          neto?: number | null
          notas?: string | null
          pdf_url?: string | null
          total?: number | null
          updated_at?: string | null
          validez_dias?: number | null
          vehicle_id?: string | null
          vendedor_id: string
        }
        Update: {
          branch_id?: string
          client_id?: string
          comprobante_pago_url?: string | null
          created_at?: string | null
          email_destinatario?: string | null
          email_enviado_at?: string | null
          estado?: Database["public"]["Enums"]["quote_status"] | null
          fecha_emision?: string | null
          folio?: string
          id?: string
          iva?: number | null
          metodo_aprobacion?: string | null
          neto?: number | null
          notas?: string | null
          pdf_url?: string | null
          total?: number | null
          updated_at?: string | null
          validez_dias?: number | null
          vehicle_id?: string | null
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
            foreignKeyName: "quotes_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "seller_performance"
            referencedColumns: ["vendedor_id"]
          },
        ]
      }
      reminder_settings: {
        Row: {
          activo: boolean | null
          canal_preferido:
            | Database["public"]["Enums"]["notification_channel"]
            | null
          created_at: string | null
          dias_previos: number
          evento: string
          id: string
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          canal_preferido?:
            | Database["public"]["Enums"]["notification_channel"]
            | null
          created_at?: string | null
          dias_previos: number
          evento: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          canal_preferido?:
            | Database["public"]["Enums"]["notification_channel"]
            | null
          created_at?: string | null
          dias_previos?: number
          evento?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      seller_goals: {
        Row: {
          created_at: string | null
          id: string
          meta_cierre_porcentaje: number | null
          meta_cotizaciones: number
          meta_ventas: number
          periodo: string
          updated_at: string | null
          vendedor_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          meta_cierre_porcentaje?: number | null
          meta_cotizaciones: number
          meta_ventas: number
          periodo: string
          updated_at?: string | null
          vendedor_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          meta_cierre_porcentaje?: number | null
          meta_cotizaciones?: number
          meta_ventas?: number
          periodo?: string
          updated_at?: string | null
          vendedor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_goals_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_goals_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "seller_performance"
            referencedColumns: ["vendedor_id"]
          },
        ]
      }
      service_checklist_items: {
        Row: {
          created_at: string | null
          id: string
          obligatorio: boolean | null
          orden: number
          service_id: string
          titulo: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          obligatorio?: boolean | null
          orden?: number
          service_id: string
          titulo: string
        }
        Update: {
          created_at?: string | null
          id?: string
          obligatorio?: boolean | null
          orden?: number
          service_id?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_checklist_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_compat_rules: {
        Row: {
          anio_max: number | null
          anio_min: number | null
          combustible: Database["public"]["Enums"]["combustible_type"] | null
          created_at: string | null
          id: string
          nota: string | null
          service_id: string
        }
        Insert: {
          anio_max?: number | null
          anio_min?: number | null
          combustible?: Database["public"]["Enums"]["combustible_type"] | null
          created_at?: string | null
          id?: string
          nota?: string | null
          service_id: string
        }
        Update: {
          anio_max?: number | null
          anio_min?: number | null
          combustible?: Database["public"]["Enums"]["combustible_type"] | null
          created_at?: string | null
          id?: string
          nota?: string | null
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_compat_rules_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          activo: boolean | null
          branch_id: string | null
          created_at: string | null
          descripcion: string | null
          id: string
          nombre: string
          precio_base: number
          requiere_checklist: boolean | null
          requiere_suscripcion: boolean | null
          solo_cotizable_externo: boolean | null
          tiempo_estimado_minutos: number
          tipos_suscripcion_disponibles: Json | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          activo?: boolean | null
          branch_id?: string | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre: string
          precio_base: number
          requiere_checklist?: boolean | null
          requiere_suscripcion?: boolean | null
          solo_cotizable_externo?: boolean | null
          tiempo_estimado_minutos?: number
          tipos_suscripcion_disponibles?: Json | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          activo?: boolean | null
          branch_id?: string | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre?: string
          precio_base?: number
          requiere_checklist?: boolean | null
          requiere_suscripcion?: boolean | null
          solo_cotizable_externo?: boolean | null
          tiempo_estimado_minutos?: number
          tipos_suscripcion_disponibles?: Json | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "services_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      services_products: {
        Row: {
          cantidad: number
          created_at: string | null
          es_sustituible: boolean | null
          id: string
          product_id: string
          service_id: string
        }
        Insert: {
          cantidad?: number
          created_at?: string | null
          es_sustituible?: boolean | null
          id?: string
          product_id: string
          service_id: string
        }
        Update: {
          cantidad?: number
          created_at?: string | null
          es_sustituible?: boolean | null
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
            foreignKeyName: "services_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "stock_by_location"
            referencedColumns: ["product_id"]
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
      stock_alerts: {
        Row: {
          created_at: string | null
          id: string
          location_id: string
          product_id: string
          resuelta: boolean | null
          resuelta_at: string | null
          resuelta_por: string | null
          stock_actual: number
          stock_minimo: number
          tipo: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          location_id: string
          product_id: string
          resuelta?: boolean | null
          resuelta_at?: string | null
          resuelta_por?: string | null
          stock_actual: number
          stock_minimo: number
          tipo: string
        }
        Update: {
          created_at?: string | null
          id?: string
          location_id?: string
          product_id?: string
          resuelta?: boolean | null
          resuelta_at?: string | null
          resuelta_por?: string | null
          stock_actual?: number
          stock_minimo?: number
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_alerts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "stock_by_location"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "stock_alerts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "stock_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_alerts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_alerts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_alerts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "stock_by_location"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "stock_alerts_resuelta_por_fkey"
            columns: ["resuelta_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_alerts_resuelta_por_fkey"
            columns: ["resuelta_por"]
            isOneToOne: false
            referencedRelation: "seller_performance"
            referencedColumns: ["vendedor_id"]
          },
        ]
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
          wo_id: string | null
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
          wo_id?: string | null
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
          wo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_moves_from_location_id_fkey"
            columns: ["from_location_id"]
            isOneToOne: false
            referencedRelation: "stock_by_location"
            referencedColumns: ["location_id"]
          },
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
            foreignKeyName: "stock_moves_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "stock_by_location"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "stock_moves_to_location_id_fkey"
            columns: ["to_location_id"]
            isOneToOne: false
            referencedRelation: "stock_by_location"
            referencedColumns: ["location_id"]
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
          {
            foreignKeyName: "stock_moves_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "seller_performance"
            referencedColumns: ["vendedor_id"]
          },
          {
            foreignKeyName: "stock_moves_wo_id_fkey"
            columns: ["wo_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
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
          {
            foreignKeyName: "subscription_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "seller_performance"
            referencedColumns: ["vendedor_id"]
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
          notificacion_config: Json | null
          periodo_meses: number
          precio: number
          suspension_automatica: boolean | null
          template_notificacion: Json | null
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          dias_gracia?: number | null
          id?: string
          nombre: string
          notificacion_config?: Json | null
          periodo_meses: number
          precio: number
          suspension_automatica?: boolean | null
          template_notificacion?: Json | null
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          dias_gracia?: number | null
          id?: string
          nombre?: string
          notificacion_config?: Json | null
          periodo_meses?: number
          precio?: number
          suspension_automatica?: boolean | null
          template_notificacion?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          app_alojada: string | null
          client_id: string
          compania: string | null
          correo_usuario: string | null
          created_at: string | null
          estado: Database["public"]["Enums"]["subscription_status"] | null
          fecha_inicio: string
          fecha_ultima_notificacion: string | null
          fecha_vencimiento: string
          folio: string
          id: string
          imei_gps: string | null
          imei_pcs: string | null
          instalador: string | null
          modelo_gps: string | null
          notas: string | null
          numero_pcs: string | null
          numeros_serie: Json | null
          plan_id: string
          ultima_notificacion_enviada: string | null
          updated_at: string | null
          vehicle_id: string | null
          wo_id: string | null
        }
        Insert: {
          app_alojada?: string | null
          client_id: string
          compania?: string | null
          correo_usuario?: string | null
          created_at?: string | null
          estado?: Database["public"]["Enums"]["subscription_status"] | null
          fecha_inicio: string
          fecha_ultima_notificacion?: string | null
          fecha_vencimiento: string
          folio: string
          id?: string
          imei_gps?: string | null
          imei_pcs?: string | null
          instalador?: string | null
          modelo_gps?: string | null
          notas?: string | null
          numero_pcs?: string | null
          numeros_serie?: Json | null
          plan_id: string
          ultima_notificacion_enviada?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
          wo_id?: string | null
        }
        Update: {
          app_alojada?: string | null
          client_id?: string
          compania?: string | null
          correo_usuario?: string | null
          created_at?: string | null
          estado?: Database["public"]["Enums"]["subscription_status"] | null
          fecha_inicio?: string
          fecha_ultima_notificacion?: string | null
          fecha_vencimiento?: string
          folio?: string
          id?: string
          imei_gps?: string | null
          imei_pcs?: string | null
          instalador?: string | null
          modelo_gps?: string | null
          notas?: string | null
          numero_pcs?: string | null
          numeros_serie?: Json | null
          plan_id?: string
          ultima_notificacion_enviada?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
          wo_id?: string | null
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
          {
            foreignKeyName: "subscriptions_wo_id_fkey"
            columns: ["wo_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
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
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "seller_performance"
            referencedColumns: ["vendedor_id"]
          },
        ]
      }
      vehicle_catalog: {
        Row: {
          anio_desde: number | null
          anio_hasta: number | null
          created_at: string | null
          id: string
          marca: string
          modelo: string
          tipo_combustible: string | null
          tipo_encendido: string | null
        }
        Insert: {
          anio_desde?: number | null
          anio_hasta?: number | null
          created_at?: string | null
          id?: string
          marca: string
          modelo: string
          tipo_combustible?: string | null
          tipo_encendido?: string | null
        }
        Update: {
          anio_desde?: number | null
          anio_hasta?: number | null
          created_at?: string | null
          id?: string
          marca?: string
          modelo?: string
          tipo_combustible?: string | null
          tipo_encendido?: string | null
        }
        Relationships: []
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
          tipo_encendido: string | null
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
          tipo_encendido?: string | null
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
          tipo_encendido?: string | null
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
      wo_checklist_templates: {
        Row: {
          created_at: string | null
          id: string
          items: Json
          service_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          items: Json
          service_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          items?: Json
          service_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wo_checklist_templates_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
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
      wo_subscription_items: {
        Row: {
          created_at: string | null
          id: string
          item_tipo: string
          nombre: string
          numeros_serie: Json | null
          ref_id: string | null
          requiere_suscripcion: boolean | null
          subscription_id: string | null
          wo_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_tipo: string
          nombre: string
          numeros_serie?: Json | null
          ref_id?: string | null
          requiere_suscripcion?: boolean | null
          subscription_id?: string | null
          wo_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          item_tipo?: string
          nombre?: string
          numeros_serie?: Json | null
          ref_id?: string | null
          requiere_suscripcion?: boolean | null
          subscription_id?: string | null
          wo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wo_subscription_items_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wo_subscription_items_wo_id_fkey"
            columns: ["wo_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      wo_substitutions: {
        Row: {
          autorizado_por: string | null
          cantidad: number
          created_at: string | null
          id: string
          producto_original_id: string
          producto_sustituto_id: string
          razon: string | null
          wo_id: string
        }
        Insert: {
          autorizado_por?: string | null
          cantidad: number
          created_at?: string | null
          id?: string
          producto_original_id: string
          producto_sustituto_id: string
          razon?: string | null
          wo_id: string
        }
        Update: {
          autorizado_por?: string | null
          cantidad?: number
          created_at?: string | null
          id?: string
          producto_original_id?: string
          producto_sustituto_id?: string
          razon?: string | null
          wo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wo_substitutions_autorizado_por_fkey"
            columns: ["autorizado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wo_substitutions_autorizado_por_fkey"
            columns: ["autorizado_por"]
            isOneToOne: false
            referencedRelation: "seller_performance"
            referencedColumns: ["vendedor_id"]
          },
          {
            foreignKeyName: "wo_substitutions_producto_original_id_fkey"
            columns: ["producto_original_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wo_substitutions_producto_original_id_fkey"
            columns: ["producto_original_id"]
            isOneToOne: false
            referencedRelation: "products_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wo_substitutions_producto_original_id_fkey"
            columns: ["producto_original_id"]
            isOneToOne: false
            referencedRelation: "stock_by_location"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "wo_substitutions_producto_sustituto_id_fkey"
            columns: ["producto_sustituto_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wo_substitutions_producto_sustituto_id_fkey"
            columns: ["producto_sustituto_id"]
            isOneToOne: false
            referencedRelation: "products_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wo_substitutions_producto_sustituto_id_fkey"
            columns: ["producto_sustituto_id"]
            isOneToOne: false
            referencedRelation: "stock_by_location"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "wo_substitutions_wo_id_fkey"
            columns: ["wo_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      work_orders: {
        Row: {
          alertas_stock: Json | null
          branch_id: string
          checklist_data: Json | null
          client_id: string
          comuna: string | null
          created_at: string | null
          direccion: string | null
          direccion_id: string | null
          duracion_minutos: number | null
          estado: Database["public"]["Enums"]["wo_status"] | null
          evidencias_urls: string[] | null
          fecha_fin_real: string | null
          fecha_inicio_real: string | null
          fecha_programada: string | null
          firma_nombre: string | null
          firma_url: string | null
          folio: string
          id: string
          inventario_consumido: boolean | null
          inventario_consumido_at: string | null
          inventario_reservado: boolean | null
          notas: string | null
          observaciones_cierre: string | null
          pdf_informe_url: string | null
          puede_editar: boolean | null
          quote_id: string | null
          region: string | null
          tecnico_id: string | null
          ubicacion_lat: number | null
          ubicacion_lng: number | null
          ubicacion_manual: string | null
          updated_at: string | null
          vehicle_id: string | null
          ventana_fin: string | null
          ventana_inicio: string | null
        }
        Insert: {
          alertas_stock?: Json | null
          branch_id: string
          checklist_data?: Json | null
          client_id: string
          comuna?: string | null
          created_at?: string | null
          direccion?: string | null
          direccion_id?: string | null
          duracion_minutos?: number | null
          estado?: Database["public"]["Enums"]["wo_status"] | null
          evidencias_urls?: string[] | null
          fecha_fin_real?: string | null
          fecha_inicio_real?: string | null
          fecha_programada?: string | null
          firma_nombre?: string | null
          firma_url?: string | null
          folio: string
          id?: string
          inventario_consumido?: boolean | null
          inventario_consumido_at?: string | null
          inventario_reservado?: boolean | null
          notas?: string | null
          observaciones_cierre?: string | null
          pdf_informe_url?: string | null
          puede_editar?: boolean | null
          quote_id?: string | null
          region?: string | null
          tecnico_id?: string | null
          ubicacion_lat?: number | null
          ubicacion_lng?: number | null
          ubicacion_manual?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
          ventana_fin?: string | null
          ventana_inicio?: string | null
        }
        Update: {
          alertas_stock?: Json | null
          branch_id?: string
          checklist_data?: Json | null
          client_id?: string
          comuna?: string | null
          created_at?: string | null
          direccion?: string | null
          direccion_id?: string | null
          duracion_minutos?: number | null
          estado?: Database["public"]["Enums"]["wo_status"] | null
          evidencias_urls?: string[] | null
          fecha_fin_real?: string | null
          fecha_inicio_real?: string | null
          fecha_programada?: string | null
          firma_nombre?: string | null
          firma_url?: string | null
          folio?: string
          id?: string
          inventario_consumido?: boolean | null
          inventario_consumido_at?: string | null
          inventario_reservado?: boolean | null
          notas?: string | null
          observaciones_cierre?: string | null
          pdf_informe_url?: string | null
          puede_editar?: boolean | null
          quote_id?: string | null
          region?: string | null
          tecnico_id?: string | null
          ubicacion_lat?: number | null
          ubicacion_lng?: number | null
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
            foreignKeyName: "work_orders_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
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
            foreignKeyName: "work_orders_tecnico_id_fkey"
            columns: ["tecnico_id"]
            isOneToOne: false
            referencedRelation: "seller_performance"
            referencedColumns: ["vendedor_id"]
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
      seller_performance: {
        Row: {
          branch_id: string | null
          branch_nombre: string | null
          cotizaciones_mes_actual: number | null
          email: string | null
          meta_cierre_porcentaje: number | null
          meta_cotizaciones: number | null
          meta_ventas: number | null
          nombre_completo: string | null
          tasa_cierre_mes_actual: number | null
          total_clientes: number | null
          vendedor_id: string | null
          ventas_mes_actual: number | null
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
      service_usage_stats: {
        Row: {
          ftf_pct: number | null
          ots_periodo: number | null
          reprogramadas: number | null
          service_id: string | null
          tiempo_promedio_real_min: number | null
        }
        Relationships: []
      }
      stock_by_location: {
        Row: {
          branch_id: string | null
          location_id: string | null
          location_nombre: string | null
          location_tipo:
            | Database["public"]["Enums"]["stock_location_type"]
            | null
          nombre: string | null
          product_id: string | null
          reservas_activas: number | null
          sku: string | null
          stock_actual: number | null
          stock_minimo: number | null
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
    }
    Functions: {
      actualizar_estado_suscripciones: { Args: never; Returns: undefined }
      ajustar_stock: {
        Args: {
          p_cantidad_nueva: number
          p_location_id: string
          p_product_id: string
          p_razon: string
        }
        Returns: string
      }
      asignar_clientes_vendedor: {
        Args: { p_client_ids: string[]; p_vendedor_id: string }
        Returns: number
      }
      calcular_metricas_vendedor: {
        Args: {
          p_fecha_desde: string
          p_fecha_hasta: string
          p_vendedor_id: string
        }
        Returns: Json
      }
      calcular_productividad_tecnicos: {
        Args: {
          p_branch_id?: string
          p_fecha_desde: string
          p_fecha_hasta: string
        }
        Returns: {
          branch_nombre: string
          eficiencia: number
          nombre_completo: string
          ots_completadas: number
          ots_totales: number
          tecnico_id: string
          tiempo_promedio_minutos: number
        }[]
      }
      calcular_rotacion_inventario: {
        Args: { p_fecha_desde: string; p_fecha_hasta: string }
        Returns: {
          consumos: number
          nombre: string
          product_id: string
          rotacion: number
          sku: string
          stock_promedio: number
        }[]
      }
      calcular_stock_producto: {
        Args: { p_location_id: string; p_product_id: string }
        Returns: number
      }
      cancelar_suscripcion: {
        Args: { p_notas?: string; p_subscription_id: string }
        Returns: undefined
      }
      check_pending_notifications: { Args: never; Returns: undefined }
      consumir_inventario_wo: { Args: { p_wo_id: string }; Returns: undefined }
      convert_quote_to_wo: { Args: { p_quote_id: string }; Returns: string }
      convert_quote_to_wo_v2: { Args: { p_quote_id: string }; Returns: string }
      create_subscription_from_wo_item: {
        Args: {
          p_fecha_inicio?: string
          p_numeros_serie: Json
          p_plan_id: string
          p_wo_subscription_item_id: string
        }
        Returns: string
      }
      expirar_cotizaciones_vencidas: { Args: never; Returns: undefined }
      generar_folio: { Args: { prefijo: string }; Returns: string }
      generar_token_aprobacion: {
        Args: { quote_id_param: string }
        Returns: string
      }
      get_user_branch: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_service_compatible: {
        Args: { p_service_id: string; p_vehicle_id: string }
        Returns: boolean
      }
      obtener_bitacora_auditoria: {
        Args: {
          p_accion?: string
          p_fecha_desde: string
          p_fecha_hasta: string
          p_limit?: number
          p_tabla?: string
          p_user_id?: string
        }
        Returns: {
          accion: string
          datos_anteriores: Json
          datos_nuevos: Json
          fecha_hora: string
          id: string
          registro_id: string
          tabla: string
          user_id: string
          user_nombre: string
        }[]
      }
      obtener_ranking_vendedores: {
        Args: {
          p_branch_id?: string
          p_fecha_desde: string
          p_fecha_hasta: string
        }
        Returns: {
          branch_nombre: string
          nombre_completo: string
          ranking: number
          tasa_cierre: number
          total_cotizaciones: number
          total_ventas: number
          vendedor_id: string
        }[]
      }
      obtener_top_productos_servicios: {
        Args: {
          p_branch_id?: string
          p_fecha_desde: string
          p_fecha_hasta: string
          p_limit?: number
        }
        Returns: {
          cantidad_total: number
          item_tipo: string
          nombre: string
          ref_id: string
          veces_vendido: number
          ventas_totales: number
        }[]
      }
      obtener_top_servicios: {
        Args: {
          p_branch_id?: string
          p_fecha_desde: string
          p_fecha_hasta: string
          p_limit?: number
          p_order_by?: string
        }
        Returns: {
          cantidad: number
          monto: number
          nombre: string
          service_id: string
        }[]
      }
      pausar_suscripcion: {
        Args: { p_notas?: string; p_subscription_id: string }
        Returns: undefined
      }
      reactivar_suscripcion: {
        Args: { p_subscription_id: string }
        Returns: undefined
      }
      realizar_respaldo_sistema: { Args: never; Returns: Json }
      refresh_service_usage_stats: { Args: never; Returns: undefined }
      refresh_stock_by_location: { Args: never; Returns: undefined }
      registrar_compra_stock: {
        Args: {
          p_cantidad: number
          p_location_id: string
          p_notas?: string
          p_precio_costo: number
          p_product_id: string
          p_referencia: string
          p_serials?: string[]
        }
        Returns: string
      }
      renovar_suscripcion: {
        Args: { p_subscription_id: string }
        Returns: undefined
      }
      reservar_inventario_wo: { Args: { p_wo_id: string }; Returns: undefined }
      reservar_materiales_servicio: {
        Args: { p_service_id: string; p_wo_id: string }
        Returns: undefined
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
      trasladar_stock: {
        Args: {
          p_cantidad: number
          p_from_location_id: string
          p_notas?: string
          p_product_id: string
          p_serials?: string[]
          p_to_location_id: string
        }
        Returns: string
      }
      verificar_alertas_stock: { Args: never; Returns: undefined }
      verificar_compatibilidad_items: {
        Args: { p_items: Json; p_vehicle_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "operador" | "tecnico" | "vendedor" | "cliente"
      client_status: "prospecto" | "activo" | "mora" | "suspendido"
      client_type: "empresa" | "persona"
      combustible_type:
        | "bencina"
        | "diesel"
        | "electrico"
        | "hibrido"
        | "cualquiera"
      invitation_status: "pendiente" | "aceptada" | "expirada"
      notification_channel: "email" | "sms" | "whatsapp"
      notification_status: "pendiente" | "enviado" | "fallido"
      quote_status:
        | "borrador"
        | "enviada"
        | "aceptada"
        | "rechazada"
        | "expirada"
        | "convertida_ot"
        | "cancelada"
        | "en_revision"
      stock_location_type: "bodega" | "camioneta"
      stock_move_type:
        | "compra"
        | "traslado"
        | "reserva"
        | "consumo"
        | "devolucion"
        | "ajuste"
      subscription_status: "activa" | "mora" | "suspendida" | "cancelada"
      user_status: "activo" | "inactivo" | "invitado"
      wo_status:
        | "programada"
        | "en_ruta"
        | "en_proceso"
        | "completada"
        | "cancelada"
        | "pendiente"
        | "asignada"
        | "pausada"
        | "reprogramada"
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
      combustible_type: [
        "bencina",
        "diesel",
        "electrico",
        "hibrido",
        "cualquiera",
      ],
      invitation_status: ["pendiente", "aceptada", "expirada"],
      notification_channel: ["email", "sms", "whatsapp"],
      notification_status: ["pendiente", "enviado", "fallido"],
      quote_status: [
        "borrador",
        "enviada",
        "aceptada",
        "rechazada",
        "expirada",
        "convertida_ot",
        "cancelada",
        "en_revision",
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
      user_status: ["activo", "inactivo", "invitado"],
      wo_status: [
        "programada",
        "en_ruta",
        "en_proceso",
        "completada",
        "cancelada",
        "pendiente",
        "asignada",
        "pausada",
        "reprogramada",
      ],
    },
  },
} as const
