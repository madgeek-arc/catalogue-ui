import { InjectionToken } from '@angular/core';

export interface AppEnvironment {
  production: boolean;
  beta: boolean;
  API_ENDPOINT: string;
  WS_ENDPOINT: string;
}

export const APP_ENV = new InjectionToken<AppEnvironment>('APP_ENV');
