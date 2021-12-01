export class UserInfo {
  memberOf: MemberOf[];
  user: User;

}

export class MemberOf {
  associationMember: string;
  contributors: string[];
  country: string;
  id: string;
  managers: string[];
  name: string;
  subType: string;
  type: string;
}

export class User {
  email: string;
  fullname: string;
  name: string;
  sub: string;
  surname: string
}
