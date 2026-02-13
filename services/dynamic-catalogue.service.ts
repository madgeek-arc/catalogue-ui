import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Model } from "../domain/dynamic-form-model";
import { APP_ENV } from "../config/app-env.token";
import { Paging } from "../domain/paging";
import { Observable } from "rxjs";

@Injectable({providedIn: 'root'})

export class DynamicCatalogueService {
  private http = inject(HttpClient);
  private environment = inject(APP_ENV);

  private readonly baseUrl = this.environment.API_ENDPOINT;

  getFormModels(from: number, quantity: number, sort: string, order: string, keyword?: string) {
    let params = new HttpParams()
      .set('from', from.toString())
      .set('quantity', quantity.toString())
      .set('sort', sort)
      .set('order', order);

    if (keyword)
      params = params.set('keyword', keyword);

    return this.http.get<Paging<Model>>(this.baseUrl + '/forms/models', {params});
  }

  postFormModel(model: Model, editMode: boolean) {
    if (editMode) {
      return this.http.put(this.baseUrl + `/forms/models/${model.id}`, model);
    } else {
      return this.http.post(this.baseUrl + '/forms/models', model);
    }
  }
}
