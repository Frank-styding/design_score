export interface View {
  view_id?: string; // UUID con valor por defecto
  project_id: string; // Referencia al proyecto (projects)
  idx: string; // Índice único por proyecto
  created_at?: string;
  updated_at?: string;
}
