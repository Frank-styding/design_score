export interface Product {
  id?: string;
  name: string;
  description?: string;
  size?: number;
  num_images?: number;
  adminId?: string; // ID del administrador que creó el producto
  coverImage: string;
  constants?: string;
  keyshot_constants?: string; // JSON string con configuración KeyShot XR
}
