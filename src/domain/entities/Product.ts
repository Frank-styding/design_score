export interface Product {
  product_id?: string;
  admin_id: string; // ID del administrador que creó el producto (referencia a auth.users)
  project_id: string; // ID del proyecto (referencia a projects)
  name: string;
  description?: string;
  cover_image?: string;
  constants?: Record<string, unknown>; // JSONB
  path?: string; // URL del producto
  weight: number; // Peso del producto, default 0
  created_at?: string;
  updated_at?: string;
}
