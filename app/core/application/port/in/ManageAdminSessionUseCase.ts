import { Admin } from "@/app/core/domain/model/Admin";

export interface ManageAdminSessionUseCase {
  login(admin: Admin): Promise<{ admin: Admin | null; message: string }>;
  logout(admin: Admin): Promise<void>;
}
