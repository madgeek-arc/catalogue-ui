import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})

export class VocabularyService {
  private http = inject(HttpClient);

  getVoc(url: string) {
    return this.http.get<object[]>(url);
  }
}
