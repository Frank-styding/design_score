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
    const { error } = await this.supabaseClient.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
  }
  async getCurrentUser(): Promise<User | null> {
    const { data, error } = await this.supabaseClient.auth.getUser();
    if (error) {
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
  }
}
