export class Answer {
  constructor(
    public id: string,
    public userId: string,
    public questionId: number,
    public answerValue: number,
    public isAnonymous: boolean,
    public comment: string
  ) {}
}
