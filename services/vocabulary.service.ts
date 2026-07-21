import { inject, Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { shareReplay } from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})

export class VocabularyService {
  private http = inject(HttpClient);
  private cache = new Map<string, Observable<object[]>>();

  getVoc(url: string): Observable<object[]> {
    let cached = this.cache.get(url);
    if (!cached) {
      cached = this.http.get<object[]>(url).pipe(shareReplay(1));
      this.cache.set(url, cached);
    }
    return cached;
  }
}
