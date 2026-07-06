import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams, HttpXsrfTokenExtractor } from "@angular/common/http";
import { Comment, CreateThread, Thread } from "../domain/comment.model";
import { BehaviorSubject, Subject } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { APP_ENV, WsTopicsConfig } from "../config/app-env.token";
import { formatTopic } from '../shared/utils/ws-topics.util';
import { loadWebsocketScripts } from '../shared/utils/script-loader.util';

declare var SockJS: any;
declare var Stomp: any;

const DEFAULT_TYPE = 'survey_answer';

const DEFAULT_TOPICS: Required<Pick<WsTopicsConfig,
  'comments' | 'commentsDelete' | 'commentsSend' | 'commentsSendDelete' | 'commentsSendMessages' | 'commentsSendMessageUpdate' | 'commentsSendMessageDelete'>> = {
  comments: '/topic/comments/{type}/{id}',
  commentsDelete: '/topic/comments/{type}/{id}/delete',
  commentsSend: '/app/comments/{type}/{id}',
  commentsSendDelete: '/app/comments/{type}/{id}/{threadId}/delete',
  commentsSendMessages: '/app/comments/{type}/{id}/{threadId}/messages',
  commentsSendMessageUpdate: '/app/comments/{type}/{id}/{threadId}/messages/{messageId}',
  commentsSendMessageDelete: '/app/comments/{type}/{id}/{threadId}/messages/{messageId}/delete',
};

interface IMessage {
  command: string;
  headers: { [key: string]: string };
  body: string;               // raw string payload
  binaryBody?: Uint8Array;    // if binary
  ack: () => void;
  nack: () => void;
}

@Injectable({
  providedIn: "root",
})
export class CommentingWebsocketService {
  private destroyRef = inject(DestroyRef);
  private xsrf = inject(HttpXsrfTokenExtractor);
  private http = inject(HttpClient);
  private environment = inject(APP_ENV);

  hasCommenting = signal<boolean>(false);

  private readonly base = this.environment.API_ENDPOINT;
  private readonly url = this.environment.WS_ENDPOINT;
  private readonly topics = { ...DEFAULT_TOPICS, ...this.environment.WS_TOPICS };
  private readonly type = DEFAULT_TYPE;
  private surveyAnswerId: string | null = null;
  threadSubject: BehaviorSubject<Thread[]> = new BehaviorSubject<Thread[]>([]);
  focusedField: Subject<string> = new Subject();

  stompClient: Promise<typeof Stomp> | undefined;

  count = 0;

  initializeWebSocketConnection(sa_id: string | null = null) {
    const that = this;
    this.surveyAnswerId = sa_id;

    this.getSAComments();

    this.stompClient = loadWebsocketScripts().then(() => new Promise((resolve, reject) => {
      const ws = new SockJS(this.url);
      let stomp = Stomp.over(ws);
      stomp.debug = null;
      stomp.connect({ 'X-XSRF-TOKEN': this.xsrf.getToken() }, function () {
        const timer = setInterval(() => {
          if (stomp.connected) {
            clearInterval(timer);
            that.count = 0;
            stomp.subscribe(formatTopic(that.topics.comments, {type: that.type, id: that.surveyAnswerId ?? ''}), (message: IMessage) => {
              console.log(message);
              if (message.body)
                that.upsertThread(JSON.parse(message.body))
              // if (message.body) {
              //   console.log('ws event, with body: ' + message.body);
              // }
            });

            stomp.subscribe(formatTopic(that.topics.commentsDelete, {type: that.type, id: that.surveyAnswerId ?? ''}), (message: IMessage) => {
              if (message.body)
                that.threadDeleted(JSON.parse(message.body))
            })
            resolve(stomp);
          }
        }, 1000);
      }, function () {
        let timeout = 1000;
        that.count > 20 ? timeout = 10_000 : that.count++ ;
        setTimeout( () => {
          // stomp.close();
          that.initializeWebSocketConnection(that.surveyAnswerId);
        }, timeout);
        console.log('STOMP: Reconnecting...'+ that.count);
      });
    }));
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

  addThread(fieldId: string, body: string, mentions: string[] = []) {
    // console.log(this.surveyAnswerId);
    const thread: CreateThread = {
      targetId: this.surveyAnswerId,
      fieldId: fieldId,
      message: {
        body: body,
        mentions: mentions
      }
    }
    this.stompClient?.then(client => client.send(formatTopic(this.topics.commentsSend, {type: this.type, id: this.surveyAnswerId ?? ''}), {}, JSON.stringify(thread)));
  }

  deleteThread(threadId: string) {
    this.stompClient?.then(client => client.send(formatTopic(this.topics.commentsSendDelete, {type: this.type, id: this.surveyAnswerId ?? '', threadId}), {}));
  }

  addMessage(threadId: string, message: Comment) {
    this.stompClient?.then(client => client.send(formatTopic(this.topics.commentsSendMessages, {type: this.type, id: this.surveyAnswerId ?? '', threadId}), {}, JSON.stringify(message)));
  }

  updateMessage(threadId: string, messageId: string, message: Comment) {
    this.stompClient?.then(client => client.send(formatTopic(this.topics.commentsSendMessageUpdate, {type: this.type, id: this.surveyAnswerId ?? '', threadId, messageId}), {}, JSON.stringify(message)));
  }

  deleteMessage(threadId: string, messageId: string) {
    this.stompClient?.then(client => client.send(formatTopic(this.topics.commentsSendMessageDelete, {type: this.type, id: this.surveyAnswerId ?? '', threadId, messageId}), {}));
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
    const params = new HttpParams().set('targetId', this.surveyAnswerId as string).set('status', status);

    return this.http.get<Thread[]>(`${this.base}/survey-answer-comments`, {params}).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: value => {
        // console.log('Just got the comments.');
        this.threadSubject.next(value);
      }, error: error => {
        console.error(error);
      }
    });
  }

  setCommenting(value: boolean) {
    this.hasCommenting.set(value);
  }

}
