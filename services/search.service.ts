import {Injectable} from "@angular/core";
import {Router} from "@angular/router";
import {URLParameter} from "../domain/url-parameter";
import {HttpClient, HttpParams} from "@angular/common/http";
import {Paging} from "../domain/paging";
import {Snippet} from "../domain/model";
import {environment} from "../../environments/environment";
import {Subject} from "rxjs";

@Injectable()
export class SearchService {

  private options = {withCredentials: true};
  base = environment.API_ENDPOINT;

  public searchParams: Subject<any> = new Subject();

  constructor(public http: HttpClient, public  router: Router) { }

  searchSnippets(urlParameters: URLParameter[]) {
    let searchQuery = new HttpParams();
    for (const urlParameter of urlParameters) {
      for (const value of urlParameter.values) {
        searchQuery = searchQuery.append(urlParameter.key, value);
      }
    }
    searchQuery.delete('to');
    return this.http.get<Paging<Object>>(this.base + `/items?resourceType=dataset_type${'&' + searchQuery.toString()}`, this.options);
    // return this.http.get<Paging<Object>>(this.base + `/items?resourceType=dataset_type`, this.options);
  }

  search(any: any) {
    return this.router.navigate(['/search', any]);
  }
}
