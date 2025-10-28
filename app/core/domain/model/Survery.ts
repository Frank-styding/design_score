export class Survey {
  constructor(
    public id: number,
    public groupId: number,
    public title: string,
    public description: string,
    public password: string,
    public is_public: boolean
  ) {}
}
