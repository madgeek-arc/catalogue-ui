import { Injectable } from "@angular/core";
import { Observable, of } from "rxjs";

export interface MentionableUser {
  email: string;
  name?: string;
}

@Injectable({
  providedIn: 'root',
  useFactory: () => new DefaultMentionableUsersProvider()
})
export abstract class MentionableUsersProvider {
  abstract getUsers(contextId: string): Observable<MentionableUser[]>;
}

export class DefaultMentionableUsersProvider extends MentionableUsersProvider {
  getUsers(contextId: string): Observable<MentionableUser[]> {
    return of([]);
  }
}

/**
 *
 * Example of overriding in a component:
 * @Component({
 *   selector: 'app-custom-feature',
 *   providers: [
 *     {
 *       provide: MentionableUsersProvider,
 *       useClass: MyCustomUsersProvider // Your specific implementation
 *     }
 *   ],
 * })
 * export class CustomFeatureComponent {}
 *
 * **/
