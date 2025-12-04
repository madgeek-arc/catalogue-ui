import { Component, DestroyRef, inject, Input, OnInit } from '@angular/core';
import { CommentAnchorService } from "../../../services/comment-anchor.service";
import { Observable } from 'rxjs';
import { AsyncPipe } from "@angular/common";
import { CommentingWebsocketService } from "../../../services/commenting-websocket.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Thread } from "../../../domain/comment.model";
import { collectIdsRecursive } from "../../../shared/utils/utils";
import { MeasureCommentDirective } from "../../../shared/directives/measure-comment.directive";


@Component({
  selector: 'app-comments-panel',
  templateUrl: './comments-panel.component.html',
  styleUrls: ['./comments-panel.component.less'],
  imports: [
    AsyncPipe,
    MeasureCommentDirective,
  ]
})

export class CommentsPanelComponent implements OnInit {
  private commentingService = inject(CommentingWebsocketService);
  private anchorService = inject(CommentAnchorService);
  private destroyRef = inject(DestroyRef);

  @Input() scrollContainer?: HTMLElement;
  @Input() subSection: object = {};
  @Input() gap = 8; // px between stacked comments

  positions$!: Observable<Map<string, number>>;
  heights$!: Observable<Map<string, number>>;
  sectionThreads: Thread[] = [];


  ngOnInit() {
    // console.log(this.subSection);
    this.positions$ = this.anchorService.positions$;
    this.heights$ = this.anchorService.heights$;

    const ids: string[] = collectIdsRecursive(this.subSection['fields']);
    this.commentingService.threadSubject.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: value => {
        this.sectionThreads = value.filter(threadId => ids.includes(threadId.fieldId));
      }
    });
  }

  getTop(comment: Thread, positions: Map<string, number>, heights: Map<string, number>): number {
    // console.log(heights);
    const anchorTop = positions.get(comment.fieldId) ?? 0;
    // get all comments for this field in the same order as `comments` input
    const sameField = this.sectionThreads.filter(t => t.fieldId === comment.fieldId);
    let topOffset = anchorTop;
    for (const c of sameField) {
      if (c.id === comment.id) break;
      const h = heights.get(c.id) ?? 80; // fallback estimated height
      topOffset += h + this.gap;
    }
    return topOffset;
  }

  onCommentSizeChange(threadId: string, size: number) {
    this.anchorService.updateCommentHeight(threadId, size);
  }

  // getTop(fieldId: string, positions: Map<string, number>): string {
  //
  //   const top = positions.get(fieldId) ?? 0;
  //   return `${top}px`;
  // }
}
