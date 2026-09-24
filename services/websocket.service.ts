import { inject, Injectable } from "@angular/core";
import { BehaviorSubject, Subject } from "rxjs";
import { HttpXsrfTokenExtractor } from "@angular/common/http";
import { APP_ENV, WsTopicsConfig } from '../config/app-env.token';
import { formatTopic } from '../shared/utils/ws-topics.util';
import { loadWebsocketScripts } from '../shared/utils/script-loader.util';

declare var SockJS;
declare var Stomp;

const DEFAULT_TOPICS: Required<Pick<WsTopicsConfig, 'activeUsers' | 'edit' | 'editDenied' | 'leave' | 'join' | 'focus' | 'editSend'>> = {
  activeUsers: '/topic/active-users/{type}/{id}',
  edit: '/topic/edit/{type}/{id}',
  editDenied: '/user/topic/edit/{type}/{id}',
  leave: '/app/leave/{type}/{id}',
  join: '/app/join/{type}/{id}',
  focus: '/app/focus/{type}/{id}/{field}',
  editSend: '/app/edit/{type}/{id}',
};

export class UserActivity {
  sessionId: string;
  fullname: string;
  action: string;
  position: string;
  color: string;
  date: Date;
}

export interface Revision {
  field: string;
  value: string;
  action?: Action;
  sessionId?: string;
  date?: string;
}

interface Action {
  type: string;
  index?: number;
}

@Injectable({ providedIn: 'root'})
export class WebsocketService {
  private xsrf = inject(HttpXsrfTokenExtractor);
  private environment = inject(APP_ENV);

  private URL = this.environment.WS_ENDPOINT;
  private topics = { ...DEFAULT_TOPICS, ...this.environment.WS_TOPICS };

  private surveyAnswerId: string | null = null;
  private type: string | null = null;
  private dropConnection = false;
  private userSessionId: string | null = null;
  private ws: any;
  private stompClient: Promise<typeof Stomp>;
  // Remembered so it can be resent automatically on every reconnect, not just the first connect.
  private lastJoinAction: string | null = null;

  activeUsers: BehaviorSubject<UserActivity[]> = new BehaviorSubject<UserActivity[]>(null);
  edit: Subject<Revision> = new Subject<Revision>();
  editDenied: Subject<string> = new Subject<string>();

  count = 0;

  initializeWebSocketConnection(id: string, resourceType: string) {
    const that = this;

    this.dropConnection = false;
    this.surveyAnswerId = id;
    this.type = resourceType;

    this.stompClient = loadWebsocketScripts().then(() => new Promise((resolve, reject) => {
      // A fresh SockJS instance is required on every attempt: once the underlying transport
      // closes, it can never re-open, so reusing it here would make later reconnects hang silently.
      that.ws = new SockJS(that.URL, undefined, {withCredentials: true});
      let stomp = Stomp.over(that.ws);

      stomp.debug = null;
      stomp.connect({ 'X-XSRF-TOKEN': this.xsrf.getToken() }, function (frame) {
        that.count = 0;
        console.log('[active-users] STOMP: Connected');
        stomp.subscribe(formatTopic(that.topics.activeUsers, {type: that.type ?? '', id: that.surveyAnswerId ?? ''}), (message) => {
          if (message.body) {
            // console.log(message.headers['message-id']);
            that.userSessionId = message.headers['message-id'].split('-')[0];
            that.activeUsers.next(JSON.parse(message.body));
            // console.log(that.activeUsers);
          }
        });
        stomp.subscribe(formatTopic(that.topics.edit, {type: resourceType ?? '', id: that.surveyAnswerId ?? ''}), (message) => {
          if (message.body) {
            console.log('edit event, with body: ' + message.body);
            that.edit.next(JSON.parse(message.body));
            // console.log(that.edit);
          }
        });
        stomp.subscribe(formatTopic(that.topics.editDenied, {type: resourceType ?? '', id: that.surveyAnswerId ?? ''}), (message) => {
          if (message.body) {
            that.editDenied.next(message.body);
          }
        });
        // Re-announce join on every (re)connect, not just the first one: the broker doesn't
        // replay the last active-users snapshot to a fresh subscription, so without this a
        // reconnected session never receives another broadcast until someone else joins/leaves.
        if (that.lastJoinAction) {
          stomp.send(formatTopic(that.topics.join, {type: that.type ?? '', id: that.surveyAnswerId ?? ''}), {}, that.lastJoinAction);
        }
        resolve(stomp);
      }, function (error) {
        if (that.dropConnection) return;
        let timeout = 1000;
        // Retry every second for ~2 minutes before backing off to a 10s cadence.
        that.count > 120 ? timeout = 10000 : that.count++ ;
        setTimeout( () => {
          // stomp.close();
          that.initializeWebSocketConnection(that.surveyAnswerId, that.type)
        }, timeout);
        console.log('[active-users] STOMP: Reconnecting...'+ that.count);
      });
    }));

    this.stompClient.then(client => client.ws.onclose = (event) => {
      this.activeUsers.next(null);
      if (this.dropConnection) return;
      let timeout = 1000;
      // Retry every second for ~2 minutes before backing off to a 10s cadence.
      that.count > 120 ? timeout = 10000 : that.count++ ;
      setTimeout( () => {
        that.initializeWebSocketConnection(that.surveyAnswerId, that.type);
      }, timeout);
      console.log('[active-users] STOMP: Reconnecting...'+ that.count);
    });
  };

  WsLeave(action: string) { // {} is for headers
    this.stompClient?.then(client => client.send(formatTopic(this.topics.leave, {type: this.type ?? '', id: this.surveyAnswerId ?? ''}), {}, action));
  }

  WsJoin(action: string) {
    this.lastJoinAction = action;
    this.stompClient?.then(client => client.send(formatTopic(this.topics.join, {type: this.type ?? '', id: this.surveyAnswerId ?? ''}), {}, action));
  }

  WsFocus(field?: string, value?: string) {
    this.stompClient?.then(client => client.send(formatTopic(this.topics.focus, {type: this.type ?? '', id: this.surveyAnswerId ?? '', field: field ?? ''}), {}, value));
  }

  WsEdit(value: { field: string; value: any; action?: Action; }) {
    // console.log(value);
    this.stompClient?.then(client => client.send(formatTopic(this.topics.editSend, {type: this.type ?? '', id: this.surveyAnswerId ?? ''}), {}, JSON.stringify(value)));
  }

  closeWs() {
    this.dropConnection = true;
    this.stompClient?.then(client => client.ws.close());
  }

  get userId() {
    return this.userSessionId;
  }
}
