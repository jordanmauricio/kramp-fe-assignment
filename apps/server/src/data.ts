export class User {
  public firstName: string;
  public lastName: string;
  public id: string;

  constructor(id: string) {
    this.id = id;
    this.firstName = 'John';
    this.lastName = 'Doe';
  }
}
