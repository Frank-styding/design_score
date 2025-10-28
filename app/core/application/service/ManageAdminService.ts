import { Admin } from "../../domain/model/Admin";
import { ManageAdminSessionUseCase } from "../port/in/ManageAdminSessionUseCase";
import { AdminRepositoryPort } from "../port/out/AdminRepositoryPort";

export class ManageAdminService implements ManageAdminSessionUseCase {
  private repository!: AdminRepositoryPort;
  useRepository(repository: AdminRepositoryPort) {
    this.repository = repository;
  }

  async login(admin: Admin): Promise<{ admin: Admin | null; message: string }> {
    const result = await this.repository.findUser(admin);

    if (result.code == 2)
      return { admin: null, message: "Usuario no encontrado" };
    if (result.code == 1)
      return { admin: null, message: "Contraseña inválida" };

    return { admin: result.admin, message: "Login exitoso" };
  }

  logout(admin: Admin): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
