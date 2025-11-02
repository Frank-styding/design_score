"use server";
import { AuthUseCase } from "@/src/domain/usecase/AuthUseCase";
import { createClient } from "@/src/infrastrucutre/supabse/client";
import { SupabaseAuthRepository } from "@/src/infrastrucutre/supabse/SupabaseAuthRepository";
import { SupabaseClient } from "@supabase/supabase-js";

export async function signInAction(email: string, password: string) {
  const client = await createClient();
  const authRepository = new SupabaseAuthRepository(client);
  const authUseCase = new AuthUseCase(authRepository);
  try {
    const { user, session } = await authUseCase.signIn(email, password);
    return { success: true, user };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function signUpAction(email: string, password: string) {
  const client = await createClient();
  const authRepository = new SupabaseAuthRepository(client);
  const authUseCase = new AuthUseCase(authRepository);
  try {
    const { user, session } = await authUseCase.signUp(email, password);
    return { success: true, user };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function signOutAction() {
  const client = await createClient();
  const authRepository = new SupabaseAuthRepository(client);
  const authUseCase = new AuthUseCase(authRepository);

  try {
    await authUseCase.signOut();
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getCurrentUserAction() {
  const client = await createClient();
  const authRepository = new SupabaseAuthRepository(client);
  const authUseCase = new AuthUseCase(authRepository);
  try {
    const user = await authUseCase.getCurrentUser();
    return { success: true, user };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
