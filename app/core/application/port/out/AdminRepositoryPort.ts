import { Admin } from "@/app/core/domain/model/Admin";

export interface AdminRepositoryPort {
  findUser(admin: Admin): Promise<{ admin: Admin | null; code: number }>;
}
