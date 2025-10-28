/* export class User {
  id?: string;
  email!: string;
  password!: string;

  constructor(params: { id?: string; email: string; password: string }) {
    this.id = params.id;
    this.email = params.email;
    this.password = params.password;
  }
}
 */

export interface User {
  id?: string;
  email: string;
  password?: string;
}
