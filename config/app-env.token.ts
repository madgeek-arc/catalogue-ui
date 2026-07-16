import { InjectionToken } from '@angular/core';

export interface WsTopicsConfig {
  activeUsers?: string;                 // default '/topic/active-users/{type}/{id}'
  edit?: string;                        // default '/topic/edit/{type}/{id}'
  leave?: string;                       // default '/app/leave/{type}/{id}'
  join?: string;                        // default '/app/join/{type}/{id}'
  focus?: string;                       // default '/app/focus/{type}/{id}/{field}'
  editSend?: string;                    // default '/app/edit/{type}/{id}'
  comments?: string;                    // default '/topic/comments/{type}/{id}'
  commentsDelete?: string;              // default '/topic/comments/{type}/{id}/delete'
  commentsSend?: string;                // default '/app/comments/{type}/{id}'
  commentsSendDelete?: string;          // default '/app/comments/{type}/{id}/{threadId}/delete'
  commentsSendMessages?: string;        // default '/app/comments/{type}/{id}/{threadId}/messages'
  commentsSendMessageUpdate?: string;   // default '/app/comments/{type}/{id}/{threadId}/messages/{messageId}'
  commentsSendMessageDelete?: string;   // default '/app/comments/{type}/{id}/{threadId}/messages/{messageId}/delete'
}

export interface AppEnvironment {
  production: boolean;
  beta: boolean;
  API_ENDPOINT: string;
  WS_ENDPOINT: string;
  WS_TOPICS?: WsTopicsConfig;
}

export const APP_ENV = new InjectionToken<AppEnvironment>('APP_ENV');
