import { Component, DestroyRef, inject, Input, OnInit } from '@angular/core';
import { CommentAnchorService } from "../../../services/comment-anchor.service";

import { Observable } from 'rxjs';
import { AsyncPipe, NgForOf, NgIf } from "@angular/common";
import { CommentingWebsocketService } from "../../../services/commenting-websocket.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Thread } from "../../../domain/comment.model";

interface Comment {
  id: string;
  fieldId: string;
  text: string;
}

@Component({
  selector: 'app-comments-panel',
  templateUrl: './comments-panel.component.html',
  styleUrls: ['./comments-panel.component.less'],
  imports: [
    AsyncPipe,
  ]
})

export class CommentsPanelComponent implements OnInit {
  private commentingService = inject(CommentingWebsocketService);
  private anchorService = inject(CommentAnchorService);
  private destroyRef = inject(DestroyRef);

  @Input() comments: Comment[] = [];
  @Input() scrollContainer?: HTMLElement;

  positions$!: Observable<Map<string, number>>;
  sectionThreads: Thread[] = [];


  ngOnInit() {
    this.positions$ = this.anchorService.positions$;
    this.commentingService.threadSubject.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: value => {
        this.sectionThreads = value;
      }
    });
  }

  getTop(fieldId: string, positions: Map<string, number>): string {
    const top = positions.get(fieldId) ?? 0;
    return `${top}px`;
  }
}
