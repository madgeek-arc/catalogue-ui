import {
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  NgZone,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { FormsModule } from "@angular/forms";
import { NgClass } from "@angular/common";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { combineLatest, fromEvent, Observable } from 'rxjs';
import { debounceTime } from "rxjs/operators";
import { CommentAnchorService } from "../../../services/comment-anchor.service";
import { CommentingWebsocketService } from "../../../services/commenting-websocket.service";
import { Comment, Thread } from "../../../domain/comment.model";
import { collectIdsRecursive } from "../../../shared/utils/utils";
import { MeasureCommentDirective } from "../../../shared/directives/measure-comment.directive";
import { Section } from "../../../domain/dynamic-form-model";
import UIkit from "uikit";

type SubSectionComments = {
  subSectionId: string;
  comments: number;
}

@Component({
  selector: 'app-comments-panel',
  templateUrl: './comments-panel.component.html',
  styleUrls: ['./comments-panel.component.less'],
  imports: [
    MeasureCommentDirective,
    FormsModule,
    NgClass,
  ]
})

export class CommentsPanelComponent implements OnInit {
  private commentingService = inject(CommentingWebsocketService);
  private anchorService = inject(CommentAnchorService);
  private destroyRef = inject(DestroyRef);
  private ngZone = inject(NgZone);

  @Input() scrollContainer?: HTMLElement; // form scroll container (passed from parent)
  @Input() subSection?: Section;
  @Input() userId: string | null = null;

  @Output() commentCount = new EventEmitter<SubSectionComments>();

  // references
  @ViewChild('panel', { static: true, read: ElementRef }) panelRef!: ElementRef<HTMLDivElement>;

  // Observables from service
  positions$!: Observable<Map<string, number>>;
  heights$!: Observable<Map<string, number>>;
  sectionThreads: Thread[] = [];
  observablesReady = false;
  gap = 8; // px between stacked comments

  // Comment message
  showInputMap = new Map<string, boolean>();
  inputMessage = '';

  // layout state
  topOffset = 0; // number of pixels added as top spacer when some items go negative
  layoutMap = new Map<string, { top: number }>();
  focusedThreadId?: string;

  // keep last values for immediate recompute/scroll
  private lastPositions = new Map<string, number>();
  private lastHeights = new Map<string, number>();

  editingComment?: Comment;
  createThreadComment: Comment = new Comment();
  // overlay state
  overlayCommentId: string | null = null;   // comment-level overlay
  overlayThreadId: string | null = null;    // card-level overlay (delete whole thread)

  ngOnInit() {
    this.positions$ = this.anchorService.positions$;
    this.heights$ = this.anchorService.heights$;

    const ids: string[] = collectIdsRecursive(this.subSection['fields'] ?? []);
    this.commentingService.threadSubject.pipe(debounceTime(30), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: value => {
        // filter threads relevant to this subsection
        this.sectionThreads = value.filter((t: Thread) => ids.includes(t.fieldId));
        // console.log('Got the comments for this subsection: ', this.subSection.id)
        // this.observablesReady = true;
        this.commentCount.emit({subSectionId: this.subSection.id, comments: this.sectionThreads.length});
        // this.threadsChanged$.next();
        this.recomputeLayout(this.lastPositions, this.lastHeights); // Recompute when the thread list changes
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

    // Scroll synchronization
    this.ngZone.runOutsideAngular(() => {
      const scrollTarget = this.scrollContainer || window;
      fromEvent(scrollTarget, 'scroll', { passive: true })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.syncScroll();
        });
    });
  }

  private syncScroll() {
    const panelEl = this.panelRef?.nativeElement;
    if (!panelEl) return;
    const target = this.topOffset + this.getFormScrollTop();
    if (Math.abs(panelEl.scrollTop - target) > 1) {
      this.ngZone.run(() => {
        panelEl.scrollTop = target;
      });
    }
  }

  private getFormScrollTop(): number {
    if (!this.scrollContainer) return window.scrollY;
    // Check if scrollContainer is actually the scrolling element
    if (this.scrollContainer === document.documentElement || this.scrollContainer === document.body)
      return window.scrollY;
    return this.scrollContainer.scrollTop;
  }

  toggleInput(id: string) {
    for (const [key, value] of this.showInputMap) {
      if (value === true && key !== id)
      this.showInputMap.set(key, false);
      // console.log(`Key: ${key}, Value: ${value}`);
    }
    this.inputMessage = '';
    this.showInputMap.set(id, !this.showInputMap.get(id));
  }

  createThread(fieldId: string, comment: string) {
    this.commentingService.addThread(fieldId, comment);
    this.commentingService.clearTmpThread();
    this.createThreadComment = new Comment();
  }

  clearTemporaryThread() {
    this.commentingService.clearTmpThread();
  }

  sendComment(threadId: string) {
    let comment: Comment = {
      body: this.inputMessage,
      mentions: []
    }

    this.commentingService.addMessage(threadId, comment);
    this.toggleInput(threadId);
  }

  updateComment(threadId: string, comment: Comment) {
    this.commentingService.updateMessage(threadId, comment.id, comment);
    this.editingComment = null;
  }

  deleteComment(threadId: string, commentId: string) {
    this.commentingService.deleteMessage(threadId, commentId);
  }

  deleteThread(threadId: string) {
    this.commentingService.deleteThread(threadId);
  }

  openOverlay(commentId: string, thread: Thread) {
    const isFirstComment = thread.messages?.length && thread.messages[0]?.id === commentId;

    if (isFirstComment) {
      // show overlay for the whole thread
      this.overlayThreadId = thread.id;
      this.overlayCommentId = null;
    } else {
      // show overlay only for the comment
      this.overlayCommentId = commentId;
      this.overlayThreadId = null;
    }

    const dropdown = UIkit.dropdown(`#kebab-menu-${commentId}`);
    if (dropdown) {
      dropdown.hide(false);
    }
  }

  closeOverlay() {
    this.overlayCommentId = null;
    this.overlayThreadId = null;
  }

  copyComment(comment: Comment) {
    this.editingComment = new Comment();
    this.editingComment.body = comment.body;
    this.editingComment.mentions = comment.mentions;
    this.editingComment.id = comment.id;

    setTimeout(() => {
      const textarea = document.getElementById(`text-area-${comment.id}`) as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();
      }
    }, 0);

    const dropdown = UIkit.dropdown(`#kebab-menu-${comment.id}`);
    if (dropdown) {
      dropdown.hide(false);
    }
  }

  onCommentSizeChange(threadId: string, size: number) {
    this.anchorService.updateCommentHeight(threadId, size);
    // heights$ emission will trigger recompute automatically; but if you want immediate,
    // we can also recompute now with the latest maps:
    // this.recomputeLayout(this.lastPositions, this.lastHeights);
  }

  // click/focus a thread
  onThreadClick(thread: Thread) {
    this.commentingService.focusedField.next(thread.fieldId);
    for (const [key] of this.showInputMap) {
      if (key !== thread.id)
        this.showInputMap.set(key, false);
      // console.log(`Key: ${key}, Value: ${value}`);
    }

    if (this.focusedThreadId !== thread.id)
      this.closeOverlay(); // Clear any open overlay.

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
      const groups: FieldGroup[] = Array.from(groupsMap.values()).sort((a, b) => a.anchorTop - b.anchorTop);

      // 3) compute each group's height (sum thread heights and gaps)
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

      // 5) if focusedThreadId exists, align the focused thread to its anchor and pull/push neighbor groups
      if (this.focusedThreadId) {
        const focusedThread = this.sectionThreads.find(t => t.id === this.focusedThreadId);
        if (focusedThread) {
          const focusedGroupIdx = groups.findIndex(g => g.fieldId === focusedThread.fieldId);
          if (focusedGroupIdx !== -1) {
            const focusedGroup = groups[focusedGroupIdx];

            // 5a) set the focused group top so that the focused thread aligns with its anchor
            let offsetInGroup = 0;
            for (const t of focusedGroup.threads) {
              if (t.id === this.focusedThreadId) break;
              offsetInGroup += t.height + this.gap;
            }
            focusedGroup.finalTop = focusedGroup.anchorTop - offsetInGroup;

            // 5b) pull previous groups up if they overlap with the now-moved focused group
            for (let i = focusedGroupIdx - 1; i >= 0; i--) {
              const cur = groups[i];
              const next = groups[i + 1];
              const neededBottom = next.finalTop! - this.gap;
              if (cur.finalTop! + cur.groupHeight > neededBottom) {
                cur.finalTop = neededBottom - cur.groupHeight;
              } else {
                break;
              }
            }

            // 5c) push the following groups down if they overlap
            for (let i = focusedGroupIdx + 1; i < groups.length; i++) {
              const prev = groups[i - 1];
              const cur = groups[i];
              const neededTop = prev.finalTop! + prev.groupHeight + this.gap;
              if (cur.finalTop! < neededTop) {
                cur.finalTop = neededTop;
              } else {
                break;
              }
            }
          }
        }
      }

      // 6) finalize per-thread positions: each thread's top = group.finalTop + offset within a group
      const rawMap = new Map<string, { top: number }>();
      for (const g of groups) {
        const groupTop = Math.round(g.finalTop ?? g.desiredTop);
        let offset = 0;
        for (let i = 0; i < g.threads.length; i++) {
          const t = g.threads[i];
          const threadTop = groupTop + offset;
          rawMap.set(t.id, { top: threadTop });
          offset += t.height + this.gap;
        }
      }

      // compute minimum top among all threads
      let minTop = Infinity;
      for (const v of rawMap.values()) {
        if (v.top < minTop) minTop = v.top;
      }

      // if minTop < 0, we will create a top spacer of height = -minTop
      // and shift every final top by that spacer so nothing has negative 'top' in the DOM.
      // This gives the user "scrollable overflow above the panel".
      const shift = minTop < 0 ? -minTop : 0;

      const adjustedMap = new Map<string, { top: number }>();
      for (const [id, v] of rawMap.entries()) {
        adjustedMap.set(id, { top: Math.round(v.top + shift) });
      }

      // 7) write back to Angular zone: new layoutMap + topOffset value
      this.ngZone.run(() => {
        this.topOffset = shift;
        this.layoutMap = adjustedMap;
      });
    });
  }

  // Make the focused thread visible and align form input with the thread if possible.
  private ensureFocusedVisible(threadId: string) {
    const panelEl = this.panelRef?.nativeElement;
    if (!panelEl) return;

    const layout = this.layoutMap.get(threadId);
    if (layout) {
      // In focus mode, we want the focused thread to align with its anchor field.
      // Based on our recomputeLayout (absolute positions):
      // focusedThread.rawTop = anchorTop
      // focusedThread.adjustedTop = anchorTop + topOffset
      // To align visually: adjustedTop - panel.scrollTop = anchorTop - form.scrollTop
      // => panel.scrollTop = topOffset + form.scrollTop
      const targetScrollTop = this.topOffset + this.getFormScrollTop();
      panelEl.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
    }

    // Also, scroll the form scroll container so the field input is visible and roughly aligned.
    if (this.scrollContainer && this.lastPositions && this.lastPositions.size > 0) {
      const thread = this.sectionThreads.find(t => t.id === threadId);
      if (!thread) return;
      const fieldTop = this.lastPositions.get(thread.fieldId) ?? 0;

      // Use absolute position to scroll form container
      const container = (this.scrollContainer === document.documentElement || this.scrollContainer === document.body)
                        ? window : this.scrollContainer;

      const containerClientHeight = (container === window) ? window.innerHeight : (container as HTMLElement).clientHeight;
      const fieldHeight = 100; // estimated
      const desiredScrollTop = Math.max(0, Math.round(fieldTop - (containerClientHeight / 2) + (fieldHeight / 2)));

      if (container === window) {
        window.scrollTo({ top: desiredScrollTop, behavior: 'smooth' });
      } else {
        (container as HTMLElement).scrollTo({ top: desiredScrollTop, behavior: 'smooth' });
      }
    }
  }

}
