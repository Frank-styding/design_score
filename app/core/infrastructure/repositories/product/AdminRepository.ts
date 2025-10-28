import { Admin } from "@/app/core/domain/model/Admin";
import { SubpabaseDB } from "../../db/SubpabaseDB";
import bcrypt from "bcryptjs";
import { AdminRepositoryPort } from "@/app/core/application/port/out/AdminRepositoryPort";

export class AdminRepository implements AdminRepositoryPort {
  async findUser(admin: Admin): Promise<{ admin: Admin | null; code: number }> {
    const { data: adminInDb, error } = await SubpabaseDB.getClient()
      .from("Admin")
      .select("*")
      .eq("email", admin.email)
      .single();

    if (error || !adminInDb) {
      return { admin: null, code: 2 };
    }

    const isPasswordValid = await bcrypt.compare(
      admin.password,
      adminInDb.password
    );

    if (!isPasswordValid) {
      return { admin: null, code: 1 };
    }

    admin.id = adminInDb.id;
    admin.name = adminInDb.name;

    return { admin: null, code: 0 };
  }
}
