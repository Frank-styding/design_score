import { User } from "@/src/domain/entities/User";
import {
  IAuthRepository,
  IAuthResponse,
} from "@/src/domain/ports/IAuthRepository";
import { SupabaseClient } from "@supabase/supabase-js";

export class SupabaseAuthRepository implements IAuthRepository {
  constructor(private supabaseClient: SupabaseClient) {}
  async signUp(email: string, password: string): Promise<IAuthResponse> {
    const { data, error } = await this.supabaseClient.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error("Registration failed");
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email || "",
        password: password,
      },
      session: data.session,
    };
  }
  async signIn(email: string, password: string): Promise<IAuthResponse> {
    const { data, error } = await this.supabaseClient.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      throw new Error(error.message);
    }
    if (!data.user || !data.session) {
      throw new Error("Authentication failed");
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email || "",
        password: password,
      },
      session: data.session,
    };
  }
  async signOut(): Promise<void> {
    try {
      // Limpiar sesión tanto en servidor como localmente
      const { error } = await this.supabaseClient.auth.signOut({
        scope: "global",
      });
      if (error) {
        console.warn("⚠️ Error en signOut del servidor:", error.message);
        // Aunque falle en servidor, limpiar localmente
        await this.supabaseClient.auth.signOut({ scope: "local" });
      }
    } catch (error: any) {
      // Si todo falla, al menos limpiar localmente
      console.error("❌ Error en signOut:", error.message);
      await this.supabaseClient.auth
        .signOut({ scope: "local" })
        .catch(() => {});
    }
  }
  async getCurrentUser(): Promise<User | null> {
    try {
      const { data, error } = await this.supabaseClient.auth.getUser();

      // Si hay error de sesión inválida/expirada, retornar null en lugar de lanzar error
      if (error) {
        // Errores comunes de sesión no válida
        const sessionErrors = [
          "invalid claim: missing sub claim",
          "invalid jwt",
          "jwt expired",
          "session not found",
          "user not found",
        ];

        const isSessionError = sessionErrors.some((err) =>
          error.message.toLowerCase().includes(err)
        );

        if (isSessionError) {
          console.warn("⚠️ Sesión inválida o expirada, limpiando...");
          // Limpiar sesión corrupta
          await this.supabaseClient.auth.signOut({ scope: "local" });
          return null;
        }

        // Otros errores sí lanzarlos
        throw new Error(error.message);
      }

      if (!data.user) {
        return null;
      }

      return {
        id: data.user.id,
        email: data.user.email || "",
        password: "", // Do not expose the password
      };
    } catch (error: any) {
      // Si falla completamente, limpiar y retornar null
      console.error("❌ Error obteniendo usuario:", error.message);
      await this.supabaseClient.auth
        .signOut({ scope: "local" })
        .catch(() => {});
      return null;
    }
  }
}
