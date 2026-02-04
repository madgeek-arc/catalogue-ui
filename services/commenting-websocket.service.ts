import { DestroyRef, inject, Injectable } from '@angular/core';
import { environment } from "../../environments/environment";
import { HttpClient, HttpParams, HttpXsrfTokenExtractor } from "@angular/common/http";
import { Comment, CreateThread, Thread } from "../domain/comment.model";
import { BehaviorSubject, Subject } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

declare var SockJS;
declare var Stomp;

const URL = environment.WS_ENDPOINT;

interface IMessage {
  command: string;
  headers: { [key: string]: string };
  body: string;               // raw string payload
  binaryBody?: Uint8Array;    // if binary
  ack: () => void;
  nack: () => void;
}

@Injectable()
export class CommentingWebsocketService {
  private http = inject(HttpClient);
  private destroyRef = inject(DestroyRef);
  private xsrf = inject(HttpXsrfTokenExtractor);

  private readonly base = environment.API_ENDPOINT;
  private surveyAnswerId: string | null = null;
  threadSubject: BehaviorSubject<Thread[]> = new BehaviorSubject<Thread[]>([]);
  focusedField: Subject<string> = new Subject();

  stompClient: Promise<typeof Stomp>;

  count = 0;

  initializeWebSocketConnection(sa_id: string) {
    const ws = new SockJS(URL);
    const that = this;
    this.surveyAnswerId = sa_id;

    this.getSAComments();

    this.stompClient = new Promise((resolve, reject) => {
      let stomp = Stomp.over(ws);
      stomp.debug = null;
      stomp.connect({ 'X-XSRF-TOKEN': this.xsrf.getToken() }, function (frame) {
        const timer = setInterval(() => {
          if (stomp.connected) {
            clearInterval(timer);
            that.count = 0;
            stomp.subscribe(`/topic/comments/survey_answer/${that.surveyAnswerId}`, (message: IMessage) => {
              console.log(message);
              if (message.body)
                that.upsertThread(JSON.parse(message.body))
              // if (message.body) {
              //   console.log('ws event, with body: ' + message.body);
              // }
            });

            stomp.subscribe(`/topic/comments/survey_answer/${that.surveyAnswerId}/delete`, (message: IMessage) => {
              if (message.body)
                that.threadDeleted(JSON.parse(message.body))
            })
            resolve(stomp);
          }
        }, 1000);
      }, function (error) {
        let timeout = 1000;
        that.count > 20 ? timeout = 10_000 : that.count++ ;
        setTimeout( () => {
          // stomp.close();
          that.initializeWebSocketConnection(that.surveyAnswerId);
        }, timeout);
        console.log('STOMP: Reconnecting...'+ that.count);
      });
    });
  }

  temporaryThreadAdd(fieldId: string) {
    const thread: Thread = {
      id: 'tmpThreadId',
      fieldId: fieldId,
      messages: [
        {
        body: '',
        mentions: []
      }
      ]
    }

    let current = this.threadSubject.value;
    const index = this.threadSubject.value.findIndex(t => t.id === thread.id);
    if (index !== -1) {
      current = [...current];
      current.splice(index, 1);
    }

    this.threadSubject.next([...current, thread])

    // Maybe set the focus to the new thread?

  }

  clearTmpThread() {
    let current = this.threadSubject.value;
    const index = this.threadSubject.value.findIndex(t => t.id === 'tmpThreadId');
    if (index !== -1) {
      current = [...current];
      current.splice(index, 1);
    }
    this.threadSubject.next(current);
  }

  addThread(fieldId: string, body: string) {
    // console.log(this.surveyAnswerId);
    const thread: CreateThread = {
      targetId: this.surveyAnswerId,
      fieldId: fieldId,
      message: {
        body: body,
        mentions: []
      }
    }
    this.stompClient?.then(client => client.send(`/app/comments/survey_answer/${this.surveyAnswerId}`, {}, JSON.stringify(thread)));
  }

  deleteThread(threadId: string) {
    this.stompClient?.then(client => client.send(`/app/comments/survey_answer/${this.surveyAnswerId}/${threadId}/delete`, {}));
  }

  addMessage(threadId: string, message: Comment) {
    this.stompClient?.then(client => client.send(`/app/comments/survey_answer/${this.surveyAnswerId}/${threadId}/messages`, {}, JSON.stringify(message)));
  }

  updateMessage(threadId: string, messageId: string, message: Comment) {
    this.stompClient?.then(client => client.send(`/app/comments/survey_answer/${this.surveyAnswerId}/${threadId}/messages/${messageId}`, {}, JSON.stringify(message)));
  }

  deleteMessage(threadId: string, messageId: string) {
    this.stompClient?.then(client => client.send(`/app/comments/survey_answer/${this.surveyAnswerId}/${threadId}/messages/${messageId}/delete`, {}));
  }

  closeWs() {
    this.stompClient?.then(client => client.ws.close());
  }

  upsertThread(thread: Thread) {
    console.log(thread);
    const current = this.threadSubject.value;
    const index = current.findIndex(t => t.id === thread.id);

    if (index === -1) {
      // Add if not found
      this.threadSubject.next([...current, thread]);
    } else {
      // Replace it if exists
      const updated = [...current];
      updated[index] = thread;
      this.threadSubject.next(updated);
    }
  }

  threadDeleted(thread: Thread) {
    const current = this.threadSubject.value;
    const index = current.findIndex(t => t.id === thread.id);
    console.log(thread)
    if (index !== -1) {
      const updated = [...current];
      updated.splice(index, 1);
      this.threadSubject.next(updated);
    }
  }

  getSAComments(status: 'ACTIVE' | 'RESOLVED' | 'DELETED' | 'HIDDEN' = 'ACTIVE') {
    const params = new HttpParams().set('targetId', this.surveyAnswerId).set('status', status);

    return this.http.get<Thread[]>(`${this.base}/survey-answer-comments`, {params}).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: value => {
        // console.log('Just got the comments.');
        this.threadSubject.next(value);
      }, error: error => {
        console.error(error);
      }
    });
  }

}
