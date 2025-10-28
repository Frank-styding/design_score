export class Admin {
  constructor(
    public email: string,
    public password: string,
    public name?: string,
    public id?: string,
    public restoreCode?: string
  ) {}
}
