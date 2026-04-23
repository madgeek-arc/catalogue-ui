import { Observable } from "rxjs";

export interface MentionableUser {
  email: string;
  name?: string;
}

export abstract class MentionableUsersProvider {
  abstract getUsers(contextId: string): Observable<MentionableUser[]>;
}
