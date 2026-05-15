import { inject, Injectable } from "@angular/core";
import { BehaviorSubject, Subject } from "rxjs";
import { HttpXsrfTokenExtractor } from "@angular/common/http";
import { APP_ENV } from '../config/app-env.token';

declare var SockJS;
declare var Stomp;

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

@Injectable()
export class WebsocketService {
  private xsrf = inject(HttpXsrfTokenExtractor);
  private environment = inject(APP_ENV);

  private URL = this.environment.WS_ENDPOINT;

  private surveyAnswerId: string | null = null;
  private type: string | null = null;
  private dropConnection = false;
  private userSessionId: string | null = null;
  private ws = new SockJS(this.URL, undefined, {withCredentials: true});
  private stompClient: Promise<typeof Stomp>;

  activeUsers: BehaviorSubject<UserActivity[]> = new BehaviorSubject<UserActivity[]>(null);
  edit: Subject<Revision> = new Subject<Revision>();

  count = 0;

  initializeWebSocketConnection(id: string, resourceType: string) {
    const that = this;

    this.dropConnection = false;
    this.surveyAnswerId = id;
    this.type = resourceType;

    this.stompClient = new Promise((resolve, reject) => {
      let stomp = Stomp.over(that.ws);

      stomp.debug = null;
      stomp.connect({ 'X-XSRF-TOKEN': this.xsrf.getToken() }, function (frame) {
        const timer = setInterval(() => {
          if (stomp.connected) {
            clearInterval(timer);
            that.count = 0;
            stomp.subscribe(`/topic/active-users/${that.type}/${that.surveyAnswerId}`, (message) => {
              if (message.body) {
                // console.log(message.headers['message-id']);
                that.userSessionId = message.headers['message-id'].split('-')[0];
                that.activeUsers.next(JSON.parse(message.body));
                // console.log(that.activeUsers);
              }
            });
            stomp.subscribe(`/topic/edit/${resourceType}/${that.surveyAnswerId}`, (message) => {
              if (message.body) {
                console.log('edit event, with body: ' + message.body);
                that.edit.next(JSON.parse(message.body));
                // console.log(that.edit);
              }
            });
            resolve(stomp);
          }
        }, 1000);
      }, function (error) {
        let timeout = 1000;
        that.count > 20 ? timeout = 10000 : that.count++ ;
        setTimeout( () => {
          // stomp.close();
          that.initializeWebSocketConnection(that.surveyAnswerId, that.type)
        }, timeout);
        console.log('STOMP: Reconnecting...'+ that.count);
      });
    });

    this.stompClient.then(client => client.ws.onclose = (event) => {
      this.activeUsers.next(null);
      if (!this.dropConnection)
        this.initializeWebSocketConnection(that.surveyAnswerId, that.type);
    });
  };

  WsLeave(action: string) { // {} is for headers
    this.stompClient?.then(client => client.send(`/app/leave/${this.type}/${this.surveyAnswerId}`, {}, action));
  }

  WsJoin(action: string) {
    this.stompClient?.then(client => client.send(`/app/join/${this.type}/${this.surveyAnswerId}`, {}, action));
  }

  WsFocus(field?: string, value?: string) {
    this.stompClient?.then(client => client.send(`/app/focus/${this.type}/${this.surveyAnswerId}/${field}`, {}, value));
  }

  WsEdit(value: { field: string; value: any; action?: Action; }) {
    // console.log(value);
    this.stompClient?.then(client => client.send(`/app/edit/${this.type}/${this.surveyAnswerId}`, {}, JSON.stringify(value)));
  }

  closeWs() {
    this.dropConnection = true;
    this.stompClient?.then(client => client.ws.close());
  }

  get userId() {
    return this.userSessionId;
  }
}
