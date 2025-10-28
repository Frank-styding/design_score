"use server";
import { SignInUserUseCase } from "@/src/domain/usecase/SignInUserUseCase";
import { SignUpUserUseCase } from "@/src/domain/usecase/SignUpUserUseCase";
import { createClient } from "@/src/infrastrucutre/supabse/client";
import { SupabaseAuthRepository } from "@/src/infrastrucutre/supabse/SupabaseAuthRepository";

export async function singInAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const client = await createClient();
  const authRepository = new SupabaseAuthRepository(client);
  const loginUseCase = new SignInUserUseCase(authRepository);
  try {
    const { user, session } = await loginUseCase.execute(email, password);
    return { success: true, user };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function signUpAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const client = await createClient();
  const authRepository = new SupabaseAuthRepository(client);
  const signUpUseCase = new SignUpUserUseCase(authRepository);
  try {
    const { user, session } = await signUpUseCase.execute(email, password);
    return { success: true, user };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function signOutAction() {
  const client = await createClient();
  const authRepository = new SupabaseAuthRepository(client);
  try {
    await authRepository.signOut();
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getCurrentUserAction() {
  const client = await createClient();
  const authRepository = new SupabaseAuthRepository(client);
  try {
    const user = await authRepository.getCurrentUser();
    return { success: true, user };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
