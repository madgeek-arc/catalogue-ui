import { InjectionToken } from '@angular/core';

export interface WsTopicsConfig {
  activeUsers?: string;
  edit?: string;
  leave?: string;
  join?: string;
  focus?: string;
  editSend?: string;
  comments?: string;
  commentsDelete?: string;
  commentsSend?: string;
  commentsSendDelete?: string;
  commentsSendMessages?: string;
  commentsSendMessageUpdate?: string;
  commentsSendMessageDelete?: string;
}

export interface AppEnvironment {
  production: boolean;
  beta: boolean;
  API_ENDPOINT: string;
  WS_ENDPOINT: string;
  WS_TOPICS?: WsTopicsConfig;
}

export const APP_ENV = new InjectionToken<AppEnvironment>('APP_ENV');
