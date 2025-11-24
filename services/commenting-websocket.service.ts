import { Injectable } from '@angular/core';
import { environment } from "../../environments/environment";

declare var SockJS;
declare var Stomp;

const URL = environment.WS_ENDPOINT;

@Injectable()
export class CommentingWebsocketService {
  private surveyAnswerId: string | null = null;

  stompClient: Promise<typeof Stomp>;

  count = 0;

  initializeWebSocketConnection(sa_id: string, ) {
    const ws = new SockJS(URL);
    const that = this;
    this.surveyAnswerId = sa_id;


    this.stompClient = new Promise((resolve, reject) => {
      let stomp = Stomp.over(ws);
      stomp.debug = null;
      stomp.connect({}, function(frame) {
        const timer = setInterval(() => {
          if (stomp.connected) {
            clearInterval(timer);
            that.count = 0;
            stomp.subscribe(`/topic/comments/survey_answer/${that.surveyAnswerId}`, (message) => {
              if (message.body) {
                console.log(message);
                console.log('ws event, with body: ' + message.body);
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
          that.initializeWebSocketConnection(that.surveyAnswerId);
        }, timeout);
        console.log('STOMP: Reconnecting...'+ that.count);
      });
    });
  }

  addThread(thread: any) {
    this.stompClient?.then(client => client.send(`app/comments/survey_answer/${this.surveyAnswerId}`, {}, JSON.stringify(thread)));
  }

  addMessage(threadId: string, message: any) {
    this.stompClient?.then(client => client.send(`app/comments/survey_answer/${this.surveyAnswerId}/${threadId}/messages`, {}, JSON.stringify(message)));
  }

  updateMessage(threadId: string, messageId: string, message: any) {
    this.stompClient?.then(client => client.send(`app/comments/survey_answer/${this.surveyAnswerId}/${threadId}/messages/${messageId}`, {}, JSON.stringify(message)));
  }

  closeWs() {
    this.stompClient?.then(client => client.ws.close());
  }
}
