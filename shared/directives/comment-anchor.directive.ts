import { Directive, ElementRef, Input, AfterViewInit, OnDestroy, NgZone } from '@angular/core';
import { fromEvent, Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { CommentAnchorService } from "../../services/comment-anchor.service";

@Directive({
  selector: '[commentAnchor]'
})

export class CommentAnchorDirective implements AfterViewInit, OnDestroy {
  @Input('commentAnchor') anchorId!: string;
  @Input() anchorContainer?: HTMLElement; // optional explicit container
  @Input() arrayPosition?: string;

  private destroy$ = new Subject<void>();

  constructor(
    private el: ElementRef<HTMLElement>,
    private anchorService: CommentAnchorService,
    private ngZone: NgZone
  ) {}

  ngAfterViewInit() {
    this.ngZone.runOutsideAngular(() => {
      // Recalculate on resize and scroll (of the window)
      fromEvent(window, 'resize')
        .pipe(debounceTime(50), takeUntil(this.destroy$))
        .subscribe(() => this.updatePosition());

      fromEvent(window, 'scroll')
        .pipe(debounceTime(50), takeUntil(this.destroy$))
        .subscribe(() => this.updatePosition());

      if (this.anchorContainer) {
        fromEvent(this.anchorContainer, 'scroll')
          .pipe(debounceTime(50), takeUntil(this.destroy$))
          .subscribe(() => this.updatePosition());
      }
    });

    // Initial position
    setTimeout(() => this.updatePosition(), 0);
    // this.updatePosition();
  }

  private updatePosition() {
    const el = this.el.nativeElement;
    const container = this.anchorContainer || document.documentElement;
    const rect = el.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    // Absolute top relative to container content
    // If container is documentElement, rect.top - containerRect.top is already absolute relative to document
    // If container is a scrollable div, we need to add its scrollTop
    const scrollTop = (container === document.documentElement || container === document.body) ? window.scrollY : (container as HTMLElement).scrollTop;
    const relativeTop = rect.top - containerRect.top + (container === document.documentElement || container === document.body ? 0 : scrollTop);

    let pos = Number.parseInt(this.arrayPosition);
    this.anchorService.updatePosition(this.anchorId, relativeTop, pos);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

// import {
//   AfterViewInit,
//   Directive,
//   DestroyRef,
//   ElementRef,
//   Input,
//   NgZone,
//   OnDestroy,
//   inject,
// } from '@angular/core';
// import { fromEvent, merge, Subject } from 'rxjs';
// import { auditTime, takeUntil } from 'rxjs/operators';
// import { CommentAnchorService } from "../../services/comment-anchor.service";
//
// @Directive({
//   selector: '[commentAnchor]',
// })
//
// export class CommentAnchorDirective implements AfterViewInit, OnDestroy {
//   private anchorService = inject(CommentAnchorService);
//   private elRef = inject(ElementRef<HTMLElement>);
//   private ngZone = inject(NgZone);
//   private destroyRef = inject(DestroyRef);
//
//   private destroy$ = new Subject<void>();
//   private ro?: ResizeObserver;
//
//   @Input({alias:'commentAnchor', required: true }) anchorId!: string;
//   @Input({alias:'anchorContainer', required: true }) scrollContainer!: HTMLElement;
//
//   /**
//    * Optional: if the same anchor is rendered in an ngFor, pass the index.
//    * CommentAnchorService currently ignores arrayPosition > 0.
//    */
//   @Input() arrayPosition?: string;
//
//   ngAfterViewInit(): void {
//     this.ngZone.runOutsideAngular(() => {
//       const scroll$ = fromEvent(this.scrollContainer, 'scroll', { passive: true });
//       const resize$ = fromEvent(window, 'resize', { passive: true });
//
//       // ResizeObserver catches local layout changes affecting the anchor element.
//       this.ro = new ResizeObserver(() => this.scheduleMeasure());
//       this.ro.observe(this.elRef.nativeElement);
//
//       // (Optional but useful) also observe the container; layout changes inside can shift anchors.
//       this.ro.observe(this.scrollContainer);
//
//       merge(scroll$, resize$)
//         .pipe(auditTime(16), takeUntil(this.destroy$))
//         .subscribe(() => this.scheduleMeasure());
//
//       // Initial measure
//       this.scheduleMeasure();
//     });
//   }
//
//   ngOnDestroy(): void {
//     this.destroy$.next();
//     this.destroy$.complete();
//     this.ro?.disconnect();
//   }
//
//   private scheduleMeasure(): void {
//     // Avoid measuring during layout thrash.
//     requestAnimationFrame(() => this.measureAndPublish());
//   }
//
//   private measureAndPublish(): void {
//     const el = this.elRef.nativeElement;
//     const container = this.scrollContainer;
//
//     if (!this.anchorId || !container || !el.isConnected) return;
//
//     const elRect = el.getBoundingClientRect();
//     const containerRect = container.getBoundingClientRect();
//
//     // Position inside the scrollable content coordinate space
//     const top = Math.round((elRect.top - containerRect.top) + container.scrollTop);
//
//     this.ngZone.run(() => {
//       let pos = Number.parseInt(this.arrayPosition);
//       this.anchorService.updatePosition(this.anchorId, top, pos);
//     });
//   }
// }
