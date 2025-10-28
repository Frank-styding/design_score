import { IAuthRepository, IAuthResponse } from "../ports/IAuthRepository";

export class SignUpUserUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}
  async execute(email: string, password: string): Promise<IAuthResponse> {
    if (!email || !password) {
      throw new Error("Email and password must be provided");
    }
    return this.authRepository.signUp(email, password);
  }
}
