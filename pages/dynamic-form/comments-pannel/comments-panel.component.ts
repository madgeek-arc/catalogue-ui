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
import { CommentAnchorService } from "../../../services/comment-anchor.service";
import { combineLatest, Observable } from 'rxjs';
import { CommentingWebsocketService } from "../../../services/commenting-websocket.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Comment, Thread } from "../../../domain/comment.model";
import { collectIdsRecursive } from "../../../shared/utils/utils";
import { MeasureCommentDirective } from "../../../shared/directives/measure-comment.directive";
import { debounceTime } from "rxjs/operators";
import { FormsModule } from "@angular/forms";
import { NgClass } from "@angular/common";
import UIkit from "uikit";
import { Section } from "../../../domain/dynamic-form-model";

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
    this.commentingService.threadSubject.pipe(debounceTime(16), takeUntilDestroyed(this.destroyRef)).subscribe({
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
      .pipe(debounceTime(16), takeUntilDestroyed(this.destroyRef))
      .subscribe(([pos, heights]) => {
        // store last
        this.lastPositions = new Map(pos);
        this.lastHeights = new Map(heights);
        this.observablesReady = true;
        this.recomputeLayout(pos, heights);
      });

    // Also recompute when threads list changes (debounced)
    // this.threadsChanged$.pipe(debounceTime(30), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
    //   this.recomputeLayout(this.lastPositions, this.lastHeights);
    // });
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
    requestAnimationFrame(() => {
      this.ngZone.runOutsideAngular(() => {
        const panelEl = this.panelRef?.nativeElement;
        if (!panelEl) return;

        type ThreadItem = {
          id: string;
          fieldId: string;
          anchorTop: number;
          height: number;
          index: number; // original order in sectionThreads
        };

        type FieldGroup = {
          fieldId: string;
          anchorTop: number;
          threads: ThreadItem[];
          groupHeight: number;
          firstThreadIndex: number; // for maintaining original order
        };

        // 1) Build array of all threads with their properties
        const threads: ThreadItem[] = this.sectionThreads.map((thread, index) => ({
          id: thread.id,
          fieldId: thread.fieldId,
          anchorTop: Math.round(positions.get(thread.fieldId) ?? 0),
          height: Math.round(heights.get(thread.id) ?? 80),
          index
        }));

        if (threads.length === 0) {
          this.ngZone.run(() => {
            this.topOffset = 0;
            this.layoutMap = new Map();
          });
          return;
        }

        // 2) Group threads by fieldId (preserve original order)
        const groupsMap = new Map<string, FieldGroup>();
        for (const thread of threads) {
          if (!groupsMap.has(thread.fieldId)) {
            groupsMap.set(thread.fieldId, {
              fieldId: thread.fieldId,
              anchorTop: thread.anchorTop,
              threads: [],
              groupHeight: 0,
              firstThreadIndex: thread.index
            });
          }
          groupsMap.get(thread.fieldId)!.threads.push(thread);
        }

        // Convert to array and keep original order (by first thread appearance)
        const groups = Array.from(groupsMap.values()).sort((a, b) =>
          a.firstThreadIndex - b.firstThreadIndex
        );

        // Calculate each group's total height
        for (const group of groups) {
          const totalThreadHeights = group.threads.reduce((sum, t) => sum + t.height, 0);
          const gapsWithinGroup = Math.max(0, group.threads.length - 1) * this.gap;
          group.groupHeight = totalThreadHeights + gapsWithinGroup;
        }

        const rawMap = new Map<string, { top: number }>();

        // 3) FOCUSED MODE: Align focused thread with its field, handle groups
        if (this.focusedThreadId) {
          const focusedThread = threads.find(t => t.id === this.focusedThreadId);

          if (focusedThread) {
            const focusedGroupIdx = groups.findIndex(g => g.fieldId === focusedThread.fieldId);

            if (focusedGroupIdx !== -1) {
              const focusedGroup = groups[focusedGroupIdx];
              const focusedThreadIdxInGroup = focusedGroup.threads.findIndex(t => t.id === this.focusedThreadId);

              // Calculate where the focused thread should be positioned (at its anchor)
              const focusedThreadTop = focusedThread.anchorTop;

              // Position the focused thread
              rawMap.set(focusedThread.id, { top: focusedThreadTop });

              // Position other threads in the same group around the focused thread
              // Threads BEFORE focused thread in group: stack upward
              let currentBottom = focusedThreadTop - this.gap;
              for (let i = focusedThreadIdxInGroup - 1; i >= 0; i--) {
                const thread = focusedGroup.threads[i];
                const threadTop = currentBottom - thread.height;
                rawMap.set(thread.id, { top: threadTop });
                currentBottom = threadTop - this.gap;
              }

              // Threads AFTER focused thread in group: stack downward
              let currentTop = focusedThreadTop + focusedThread.height + this.gap;
              for (let i = focusedThreadIdxInGroup + 1; i < focusedGroup.threads.length; i++) {
                const thread = focusedGroup.threads[i];
                rawMap.set(thread.id, { top: currentTop });
                currentTop += thread.height + this.gap;
              }

              // Now handle OTHER groups (before and after the focused group)
              // Smart stacking: only stack if there's not enough space to align at anchor

              // Groups BEFORE focused group: try to align at anchor, stack only if overlapping
              const focusedGroupTop = Math.min(...focusedGroup.threads.map(t => rawMap.get(t.id)!.top));
              let nextGroupBottomConstraint = focusedGroupTop - this.gap;

              for (let i = focusedGroupIdx - 1; i >= 0; i--) {
                const group = groups[i];

                // Try to place at anchor first
                let groupTop = group.anchorTop;
                const groupBottom = groupTop + group.groupHeight;

                // Check if it would overlap with the group below (or focused group)
                if (groupBottom + this.gap > nextGroupBottomConstraint) {
                  // Overlap detected - must stack upward
                  groupTop = nextGroupBottomConstraint - group.groupHeight;
                }

                // Position all threads in this group
                let offset = 0;
                for (const thread of group.threads) {
                  rawMap.set(thread.id, { top: groupTop + offset });
                  offset += thread.height + this.gap;
                }

                // Update constraint for next group above
                nextGroupBottomConstraint = groupTop - this.gap;
              }

              // Groups AFTER focused group: try to align at anchor, stack only if overlapping
              const focusedGroupBottom = Math.max(...focusedGroup.threads.map(t =>
                rawMap.get(t.id)!.top + t.height
              ));
              let prevGroupTopConstraint = focusedGroupBottom + this.gap;

              for (let i = focusedGroupIdx + 1; i < groups.length; i++) {
                const group = groups[i];

                // Try to place at anchor first
                let groupTop = group.anchorTop;

                // Check if it would overlap with the group above (or focused group)
                if (groupTop < prevGroupTopConstraint) {
                  // Overlap detected - must stack downward
                  groupTop = prevGroupTopConstraint;
                }

                // Position all threads in this group
                let offset = 0;
                for (const thread of group.threads) {
                  rawMap.set(thread.id, { top: groupTop + offset });
                  offset += thread.height + this.gap;
                }

                // Update constraint for next group below
                prevGroupTopConstraint = groupTop + group.groupHeight + this.gap;
              }
            }
          }
        } else {
          // 4) UNFOCUSED MODE: Place groups sequentially, try to align with anchors

          let prevGroupBottom = -Infinity;

          for (const group of groups) {
            // Try to place group at its anchor position
            let groupTop = group.anchorTop;

            // If it would overlap with previous group, push it down
            if (groupTop < prevGroupBottom + this.gap) {
              groupTop = prevGroupBottom + this.gap;
            }

            // Position all threads in this group
            let offset = 0;
            for (const thread of group.threads) {
              rawMap.set(thread.id, { top: groupTop + offset });
              offset += thread.height + this.gap;
            }

            prevGroupBottom = groupTop + group.groupHeight;
          }
        }

        // 5) Compute minimum top and create spacer if needed (for negative overflow)
        let minTop = Infinity;
        for (const v of rawMap.values()) {
          if (v.top < minTop) minTop = v.top;
        }

        const shift = minTop < 0 ? -minTop : 0;

        // 6) Apply shift to all positions
        const adjustedMap = new Map<string, { top: number }>();
        for (const [id, v] of rawMap.entries()) {
          adjustedMap.set(id, { top: Math.round(v.top + shift) });
        }

        // 7) Write back to Angular zone
        this.ngZone.run(() => {
          this.topOffset = shift;
          this.layoutMap = adjustedMap;
        });
      });
    });
  }

  // Make the focused thread visible and align form input with the thread if possible.
  // Strategy:
  //  1. Scroll both the form container and comments panel
  //  2. Aim to position the focused thread and its anchored field at the same viewport position
  //  3. Account for the topOffset spacer in the comments panel
  private ensureFocusedVisible(threadId: string) {
    const panelEl = this.panelRef?.nativeElement;
    if (!panelEl || !this.scrollContainer) return;

    const thread = this.sectionThreads.find(t => t.id === threadId);
    if (!thread) return;

    const layout = this.layoutMap.get(threadId);
    if (!layout) return;

    // Position of the focused thread in the comments panel (includes topOffset shift)
    const focusedTopInPanel = layout.top;

    // Position of the anchored field in the form container (content-space coordinates)
    const anchorTopInForm = this.lastPositions.get(thread.fieldId) ?? 0;

    // Key insight: Due to the topOffset shift applied during overflow,
    // focusedTopInPanel and anchorTopInForm are in different coordinate spaces.
    // To align them visually, both should appear at the same position in their viewports.

    // Target: show both at the same relative position (1/3 from top of viewport)
    const panelHeight = panelEl.clientHeight;
    const formHeight = this.scrollContainer.clientHeight;
    const targetOffsetFromTop = Math.min(panelHeight, formHeight) / 3;

    // Simple solution: Scroll each container independently to show its content
    // at targetOffsetFromTop. This naturally accounts for any coordinate space differences.

    // Viewport position formula: viewportPos = contentPos - scrollPos
    // We want: viewportPos = targetOffsetFromTop
    // Therefore: scrollPos = contentPos - targetOffsetFromTop

    // Panel: scroll to show focused thread at targetOffsetFromTop
    const panelScrollTop = Math.max(0, focusedTopInPanel - targetOffsetFromTop);
    panelEl.scrollTo({ top: panelScrollTop, behavior: 'smooth' });

    // Form: scroll to show anchored field at targetOffsetFromTop
    const formScrollTop = Math.max(0, anchorTopInForm - targetOffsetFromTop);
    this.scrollContainer.scrollTo({ top: formScrollTop, behavior: 'smooth' });
  }

  // private ensureFocusedVisible(threadId: string) {
  //   const panelEl = this.panelRef?.nativeElement;
  //   if (!panelEl) return;
  //
  //   const thread = this.sectionThreads.find(t => t.id === threadId);
  //   if (!thread) return;
  //
  //   const layout = this.layoutMap.get(threadId);
  //   if (!layout) return;
  //
  //   const focusedTop = layout.top;
  //
  //   // Anchor position inside the form scroll container (your measured coordinate space)
  //   const anchorTop = this.lastPositions.get(thread.fieldId) ?? 0;
  //
  //   // Because the panel adds a top spacer and shifts all thread tops by `topOffset`,
  //   // the equivalent "anchor line" inside panel scroll coordinates is:
  //   const panelAnchorY = anchorTop + this.topOffset;
  //
  //   // Scroll panel so focused thread's top lands exactly on the anchor line
  //   const targetPanelScrollTop = Math.max(0, Math.round(focusedTop - panelAnchorY));
  //
  //   panelEl.scrollTo({ top: targetPanelScrollTop, behavior: 'smooth' });
  //
  //   // Keep the form container behavior as-is (optional), but this is independent.
  //   if (this.scrollContainer) {
  //     const container = this.scrollContainer;
  //     const containerClientHeight = container.clientHeight;
  //     const desiredScrollTop = Math.max(0, Math.round(anchorTop - (containerClientHeight / 2)));
  //     container.scrollTo({ top: desiredScrollTop, behavior: 'smooth' });
  //   }
  // }
}
