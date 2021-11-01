import {Injectable} from "@angular/core";
import {environment} from "../../environments/environment";
import {HttpClient} from "@angular/common/http";

@Injectable()
export class LandingPageService {

  private options = {withCredentials: true};
  base = environment.API_ENDPOINT;

  constructor(protected http: HttpClient) {}

  getDataset(id: string, resourceType?: string) {
    return this.http.get(this.base + `/items/${id}?resourceType=dataset_type`);
  }

}
