// import { Component, DestroyRef, inject, Input, OnInit } from '@angular/core';
// import { CommentAnchorService } from "../../../services/comment-anchor.service";
// import { Observable } from 'rxjs';
// import { AsyncPipe } from "@angular/common";
// import { CommentingWebsocketService } from "../../../services/commenting-websocket.service";
// import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
// import { Thread } from "../../../domain/comment.model";
// import { collectIdsRecursive } from "../../../shared/utils/utils";
// import { MeasureCommentDirective } from "../../../shared/directives/measure-comment.directive";
//
//
// @Component({
//   selector: 'app-comments-panel',
//   templateUrl: './comments-panel.component.html',
//   styleUrls: ['./comments-panel.component.less'],
//   imports: [
//     AsyncPipe,
//     MeasureCommentDirective,
//   ]
// })
//
// export class CommentsPanelComponent implements OnInit {
//   private commentingService = inject(CommentingWebsocketService);
//   private anchorService = inject(CommentAnchorService);
//   private destroyRef = inject(DestroyRef);
//
//   @Input() scrollContainer?: HTMLElement;
//   @Input() subSection: object = {};
//   @Input() gap = 8; // px between stacked comments
//
//   positions$!: Observable<Map<string, number>>;
//   heights$!: Observable<Map<string, number>>;
//   sectionThreads: Thread[] = [];
//
//   ngOnInit() {
//     // console.log(this.subSection);
//     this.positions$ = this.anchorService.positions$;
//     this.heights$ = this.anchorService.heights$;
//
//     const ids: string[] = collectIdsRecursive(this.subSection['fields']);
//     this.commentingService.threadSubject.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
//       next: value => {
//         this.sectionThreads = value.filter(threadId => ids.includes(threadId.fieldId));
//       }
//     });
//   }
//
//   getTop(comment: Thread, positions: Map<string, number>, heights: Map<string, number>): number {
//     // console.log(heights);
//     const anchorTop = positions.get(comment.fieldId) ?? 0;
//     // get all comments for this field in the same order as `comments` input
//     const sameField = this.sectionThreads.filter(t => t.fieldId === comment.fieldId);
//     let topOffset = anchorTop;
//     for (const c of sameField) {
//       if (c.id === comment.id) break;
//       const h = heights.get(c.id) ?? 80; // fallback estimated height
//       topOffset += h + this.gap;
//     }
//     return topOffset;
//   }
//
//   onCommentSizeChange(threadId: string, size: number) {
//     this.anchorService.updateCommentHeight(threadId, size);
//   }
// }

import {
  Component,
  DestroyRef,
  ElementRef,
  ViewChild,
  inject,
  Input,
  OnInit,
  NgZone, Output, EventEmitter
} from '@angular/core';
import { CommentAnchorService } from "../../../services/comment-anchor.service";
import { combineLatest, Observable, Subject } from 'rxjs';
import { AsyncPipe } from "@angular/common";
import { CommentingWebsocketService } from "../../../services/commenting-websocket.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Thread } from "../../../domain/comment.model";
import { collectIdsRecursive } from "../../../shared/utils/utils";
import { MeasureCommentDirective } from "../../../shared/directives/measure-comment.directive";
import { debounceTime } from "rxjs/operators";

type SubSectionComments = {
  subSectionId: string;
  comments: number;
}

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
  private ngZone = inject(NgZone);

  @Input() scrollContainer?: HTMLElement; // form scroll container (passed from parent)
  @Input() subSection: any = {};
  @Input() gap = 8; // px between stacked comments

  @Output() commentCount = new EventEmitter<SubSectionComments>();

  // references
  @ViewChild('panel', { static: true, read: ElementRef }) panelRef!: ElementRef<HTMLDivElement>;

  // Observables from service
  positions$!: Observable<Map<string, number>>;
  heights$!: Observable<Map<string, number>>;
  sectionThreads: Thread[] = [];
  observablesReady = false;

  // layout state
  layoutMap = new Map<string, { top: number }>();
  focusedThreadId?: string;

  // keep last values for immediate recompute/scroll
  private lastPositions = new Map<string, number>();
  private lastHeights = new Map<string, number>();

  // trigger recomputing when the thread list changes
  private threadsChanged$ = new Subject<void>();

  ngOnInit() {
    this.positions$ = this.anchorService.positions$;
    this.heights$ = this.anchorService.heights$;

    const ids: string[] = collectIdsRecursive(this.subSection['fields'] ?? []);
    this.commentingService.threadSubject.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: value => {
        // filter threads relevant to this subsection
        this.sectionThreads = value.filter((t: Thread) => ids.includes(t.fieldId));
        this.commentCount.emit({subSectionId: this.subSection.id, comments: this.sectionThreads.length});
        this.threadsChanged$.next();
      }
    });

    // Combine positions + heights + thread changes: recompute layout
    combineLatest([this.positions$, this.heights$])
      .pipe(debounceTime(30), takeUntilDestroyed(this.destroyRef))
      .subscribe(([pos, heights]) => {
        // store last
        this.lastPositions = new Map(pos);
        this.lastHeights = new Map(heights);
        this.observablesReady = true;
        this.recomputeLayout(pos, heights);
      });

    // Also recompute when threads list changes (debounced)
    this.threadsChanged$.pipe(debounceTime(30), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.recomputeLayout(this.lastPositions, this.lastHeights);
    });
  }

  onCommentSizeChange(threadId: string, size: number) {
    this.anchorService.updateCommentHeight(threadId, size);
    // heights$ emission will trigger recompute automatically; but if you want immediate,
    // we can also recompute now with the latest maps:
    // this.recomputeLayout(this.lastPositions, this.lastHeights);
  }

  // click/focus a thread
  onThreadClick(thread: Thread) {
    this.focusedThreadId = thread.id;
    // recompute layout immediately using last-known maps
    this.recomputeLayout(this.lastPositions, this.lastHeights);
    // ensure the focused thread and the corresponding input are visible/aligned
    setTimeout(() => this.ensureFocusedVisible(thread.id), 0);
  }

  private recomputeLayout(positions: Map<string, number>, heights: Map<string, number>) {
    this.ngZone.runOutsideAngular(() => {
      const panelEl = this.panelRef?.nativeElement;
      if (!panelEl) return;
      // const panelHeight = Math.round(panelEl.clientHeight);

      type ThreadItem = {
        id: string;
        fieldId: string;
        height: number;
      };

      type FieldGroup = {
        fieldId: string;
        anchorTop: number;
        threads: ThreadItem[];      // in display/order-preserving sequence
        groupHeight: number;       // sum heights + gaps between threads
        desiredTop: number;        // anchorTop (initially)
        finalTop?: number;         // computed later
      };

      // 1) group threads by field (keep order of threads as in this.sectionThreads)
      const groupsMap = new Map<string, FieldGroup>();
      for (const thread of this.sectionThreads) {
        const h = Math.round(heights.get(thread.id) ?? 80);
        const fieldId = thread.fieldId;
        if (!groupsMap.has(fieldId)) {
          const anchor = Math.round(positions.get(fieldId) ?? 0);
          groupsMap.set(fieldId, {
            fieldId,
            anchorTop: anchor,
            threads: [],
            groupHeight: 0,
            desiredTop: anchor
          });
        }
        const grp = groupsMap.get(fieldId)!;
        grp.threads.push({ id: thread.id, fieldId, height: h });
      }

      // If there are fields with no threads, they are irrelevant here.
      // 2) create an array of groups ordered by field anchorTop (top-to-bottom)
      const groups: FieldGroup[] = Array.from(groupsMap.values())
        .sort((a, b) => a.anchorTop - b.anchorTop);

      // 3) compute each group's height (sum thread heights + gaps)
      for (const g of groups) {
        const totalHeights = g.threads.reduce((sum, t) => sum + t.height, 0);
        const gapsBetween = Math.max(0, g.threads.length - 1) * this.gap;
        g.groupHeight = totalHeights + gapsBetween;
        g.desiredTop = g.anchorTop;
      }

      // 4) initial pass: ensure groups don't overlap by pushing groups (group-level push-down)
      let prevBottom = -Infinity;
      for (const g of groups) {
        let top = g.desiredTop;
        if (top <= prevBottom + this.gap) {
          top = prevBottom + this.gap;
        }
        g.finalTop = Math.round(top);
        prevBottom = g.finalTop + g.groupHeight;
      }

      // 5) if focusedThreadId exists, align its group to its anchor and pull/push neighbor groups
      if (this.focusedThreadId) {
        // find which group contains the focused thread
        const focusedThread = this.sectionThreads.find(t => t.id === this.focusedThreadId);
        if (focusedThread) {
          const targetGroupIdx = groups.findIndex(g => g.fieldId === focusedThread.fieldId);
          if (targetGroupIdx !== -1) {
            // 5a) set focused group top to its anchor (align)
            const focusedGroup = groups[targetGroupIdx];
            focusedGroup.finalTop = focusedGroup.desiredTop;

            // 5b) pull previous groups up if overlapping
            for (let i = targetGroupIdx - 1; i >= 0; i--) {
              const cur = groups[i];
              const next = groups[i + 1];
              const desiredBottomForCur = (next.finalTop ?? next.desiredTop) - this.gap;
              const candidateTop = desiredBottomForCur - cur.groupHeight;
              if (candidateTop < (cur.finalTop ?? cur.desiredTop)) {
                cur.finalTop = Math.max(0, Math.round(candidateTop));
              } else {
                // no more conflicts upward
                break;
              }
            }

            // 5c) push following groups down if they overlap
            for (let i = targetGroupIdx + 1; i < groups.length; i++) {
              const prev = groups[i - 1];
              const cur = groups[i];
              const neededTop = (prev.finalTop ?? prev.desiredTop) + prev.groupHeight + this.gap;
              if ((cur.finalTop ?? cur.desiredTop) < neededTop) {
                cur.finalTop = Math.round(neededTop);
              } else {
                break;
              }
            }
          }
        }
      }

      // 6) finalize per-thread positions: each thread's top = group.finalTop + offset within group
      const newMap = new Map<string, { top: number }>();
      for (const g of groups) {
        const groupTop = Math.max(0, Math.round(g.finalTop ?? g.desiredTop));
        let offset = 0;
        for (let i = 0; i < g.threads.length; i++) {
          const t = g.threads[i];
          const threadTop = groupTop + offset;
          newMap.set(t.id, { top: threadTop });
          offset += t.height + this.gap;
        }
      }

      // 7) write back to Angular zone
      this.ngZone.run(() => {
        this.layoutMap = newMap;
      });
    });
  }


  // main layout algorithm (resolves collisions inside the comments column)
  // private recomputeLayout(positions: Map<string, number>, heights: Map<string, number>) {
  //   // run layout off-Angular for CPU work, then write results inside Angular
  //   this.ngZone.runOutsideAngular(() => {
  //     const panelEl = this.panelRef?.nativeElement;
  //     if (!panelEl) return;
  //     // const containerHeight = Math.round(panelEl.clientHeight);
  //
  //     type Item = {
  //       id: string;
  //       fieldId: string;
  //       height: number;
  //       desiredTop: number;
  //       finalTop?: number;
  //     };
  //
  //     // Build items with the desiredTop (stack same-field threads)
  //     const items: Item[] = [];
  //     const fieldOffsets = new Map<string, number>();
  //
  //     for (const thread of this.sectionThreads) {
  //       const anchorTop = positions.get(thread.fieldId) ?? 0;
  //       const currentFieldOffset = fieldOffsets.get(thread.fieldId) ?? 0;
  //       const h = heights.get(thread.id) ?? 80; // fallback
  //       const desired = anchorTop + currentFieldOffset;
  //       items.push({
  //         id: thread.id,
  //         fieldId: thread.fieldId,
  //         height: Math.round(h),
  //         desiredTop: Math.round(desired)
  //       });
  //       fieldOffsets.set(thread.fieldId, currentFieldOffset + Math.round(h) + this.gap);
  //     }
  //
  //     // Sort by desiredTop
  //     items.sort((a, b) => a.desiredTop - b.desiredTop);
  //
  //     // 1) push-down collision resolution inside the panel
  //     let prevBottom = -Infinity;
  //     for (const it of items) {
  //       let top = it.desiredTop;
  //       if (top <= prevBottom + this.gap) {
  //         top = prevBottom + this.gap;
  //       }
  //       it.finalTop = Math.round(top);
  //       prevBottom = it.finalTop + it.height;
  //     }
  //
  //     // 2) If a focused thread exists, try to align it to its anchor desiredTop and push/pull neighbors
  //     if (this.focusedThreadId) {
  //       const idx = items.findIndex(i => i.id === this.focusedThreadId);
  //       if (idx !== -1) {
  //         const focused = items[idx];
  //         // Put focused at its desired top (align to input)
  //         focused.finalTop = focused.desiredTop;
  //
  //         // Pull previous threads up if overlap
  //         for (let j = idx - 1; j >= 0; j--) {
  //           const cur = items[j];
  //           const next = items[j + 1];
  //           const desiredBottomForCur = (next.finalTop ?? next.desiredTop) - this.gap;
  //           const candidateTop = desiredBottomForCur - cur.height;
  //           if (candidateTop < cur.finalTop!) {
  //             cur.finalTop = Math.max(0, Math.round(candidateTop));
  //           } else {
  //             break;
  //           }
  //         }
  //
  //         // Push next threads down if overlap
  //         for (let j = idx + 1; j < items.length; j++) {
  //           const prev = items[j - 1];
  //           const cur = items[j];
  //           const neededTop = (prev.finalTop ?? prev.desiredTop) + prev.height + this.gap;
  //           if ((cur.finalTop ?? cur.desiredTop) < neededTop) {
  //             cur.finalTop = Math.round(neededTop);
  //           } else {
  //             break;
  //           }
  //         }
  //       }
  //     }
  //
  //     // 3) Clamp layout so nothing gets negative top and let overflow be scrollable (no floating)
  //     //    We will simply produce finalTop values and let the comments panel scroll when content exceeds panel height
  //     const newMap = new Map<string, { top: number }>();
  //     for (const it of items) {
  //       const top = Math.max(0, Math.round(it.finalTop ?? it.desiredTop));
  //       newMap.set(it.id, { top });
  //     }
  //
  //     // Write results back to Angular zone (as a new Map reference).
  //     this.ngZone.run(() => {
  //       this.layoutMap = newMap;
  //     });
  //   });
  // }

  // Make the focused thread visible and align form input with the thread if possible.
  // Two things:
  //  - Scroll the comments panel so the focused thread is visible at approximately the same vertical position
  //  - Scroll the form scrollContainer so the anchored input is visible (positions were computed relative to it)
  private ensureFocusedVisible(threadId: string) {
    const panelEl = this.panelRef?.nativeElement;
    if (!panelEl) return;

    const layout = this.layoutMap.get(threadId);
    if (layout) {
      const focusedTop = layout.top;
      const focusedHeight = this.lastHeights.get(threadId) ?? 100;

      // Scroll the comments panel to bring a focused thread into view (prefer center)
      // const panelScrollTop = panelEl.scrollTop;
      const panelClientHeight = panelEl.clientHeight;
      const targetTopInPanel = Math.max(0, focusedTop - Math.round(panelClientHeight / 2) + Math.round(focusedHeight / 2));

      panelEl.scrollTo({ top: targetTopInPanel, behavior: 'smooth' });
    }

    // Also, scroll the form scroll container so the field input is visible and roughly aligned.
    if (this.scrollContainer && this.lastPositions && this.lastPositions.size > 0) {
      // we need to map the threadId -> its fieldId (we have sectionThreads)
      const thread = this.sectionThreads.find(t => t.id === threadId);
      if (!thread) return;
      const fieldTop = this.lastPositions.get(thread.fieldId) ?? 0;

      // Scroll the form container so the input area appears near center too.
      // Note: positions were measured as rect.top - containerRect.top by commentAnchor directive,
      // therefore, they correspond to a y-offset inside scrollContainer.
      const container = this.scrollContainer;
      const containerClientHeight = container.clientHeight;
      const desiredScrollTop = Math.max(0, Math.round(fieldTop - (containerClientHeight / 2)));
      container.scrollTo({ top: desiredScrollTop, behavior: 'smooth' });
    }
  }
}
