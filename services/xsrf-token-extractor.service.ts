import { HttpClient, HttpXsrfTokenExtractor } from "@angular/common/http";
import { Injectable, NgZone, signal } from '@angular/core';
import { catchError, finalize, map, take, tap } from "rxjs/operators";
import { of } from "rxjs";

@Injectable({ providedIn: 'root' })
export class XsrfTokenExtractor implements HttpXsrfTokenExtractor {
  private csrfUrl = null;

  readonly token = signal<string | null>(null);
  private readonly inFlight = signal(false);
  private readonly lastFetchMs = signal(0);

  private readonly minRefreshIntervalMs = 30_000;

  constructor(private http: HttpClient, private zone: NgZone) {}

  getHeader(): Record<string, string> | {} {
    const t = this.getToken();
    return t ? { 'X-XSRF-TOKEN': t } : {};
  }

  getToken(): string | null {
    const t = this.token();
    if (!t) {
      void this.fetch(true);
      return null;
    }
    void this.fetch(false);
    return t;
  }

  async init(csrfEndpoint: string): Promise<void> {
    this.csrfUrl = csrfEndpoint;
    if (!this.csrfUrl) throw new Error('CSRF endpoint url is null.');

    const t = await this.fetch(true);
    if (!t) throw new Error(`CSRF init failed: ${this.csrfUrl} did not return "token".`);
  }

  private fetch(force: boolean): Promise<string | null> {
    if (!this.csrfUrl) return Promise.resolve(null);

    const now = Date.now();
    if (this.inFlight()) return Promise.resolve(this.token());
    if (!force && now - this.lastFetchMs() < this.minRefreshIntervalMs) return Promise.resolve(this.token());

    this.inFlight.set(true);

    return new Promise<string | null>((resolve) => {
      this.zone.runOutsideAngular(() => {
        this.http.get<{ token?: string }>(this.csrfUrl!, { withCredentials: true }).pipe(
          take(1),
          map(res => res?.token ?? null),
          tap(t => { if (t) this.token.set(t); }),
          catchError(err => {
            console.error('CSRF token fetch failed:', err);
            return of(null);
          }),
          finalize(() => {
            this.lastFetchMs.set(Date.now());
            this.inFlight.set(false);
          }),
        ).subscribe((t) => resolve(t ?? this.token()));
      });
    });
  }
}
