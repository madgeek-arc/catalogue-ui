import {Injectable} from "@angular/core";
import {environment} from "../../environments/environment";
import {HttpClient} from "@angular/common/http";
import {MemberOf, StakeholdersMembers, UserInfo} from "../../app/domain/userInfo";
import {BehaviorSubject, Observable, Subject} from "rxjs";
import {Paging} from "../domain/paging";
import {Survey} from "../../app/domain/survey";

@Injectable()
export class UserService {

  options = {withCredentials: true};
  base = environment.API_ENDPOINT;

  currentStakeholderGroup = new BehaviorSubject<MemberOf>(null);

  constructor(public http: HttpClient) {}


  changeCurrentGroup(currentGroup: MemberOf) {
    this.currentStakeholderGroup.next(currentGroup);
  }

  getUserInfo() {
    return this.http.get<UserInfo>(this.base + '/user/info');
  }

  getUserSurveys(type: string) {
    return this.http.get<Paging<Survey>>(this.base + `/surveys/type/${type}`);
  }

  getStakeholdersMembers(id: string) {
    return this.http.get<StakeholdersMembers>(this.base + `/stakeholders/${id}/members`);
  }

}
