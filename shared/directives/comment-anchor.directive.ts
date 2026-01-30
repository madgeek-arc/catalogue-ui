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
  private ro?: ResizeObserver;

  constructor(
    private el: ElementRef<HTMLElement>,
    private anchorService: CommentAnchorService,
    private ngZone: NgZone
  ) {}

  ngAfterViewInit() {
    this.ngZone.runOutsideAngular(() => {
      const container = this.anchorContainer ?? document.body;

      // Listen to container scroll events (not window scroll)
      const scrollTarget = container === document.body ? window : container;
      fromEvent(scrollTarget, 'scroll', { passive: true })
        .pipe(debounceTime(16), takeUntil(this.destroy$))
        .subscribe(() => this.scheduleMeasure());

      fromEvent(window, 'resize', { passive: true })
        .pipe(debounceTime(16), takeUntil(this.destroy$))
        .subscribe(() => this.scheduleMeasure());

      // ResizeObserver for element and container layout changes
      this.ro = new ResizeObserver(() => this.scheduleMeasure());
      this.ro.observe(this.el.nativeElement);
      if (container !== document.body) {
        this.ro.observe(container);
      }
    });

    // Initial position
    this.scheduleMeasure();
  }

  private scheduleMeasure() {
    requestAnimationFrame(() => this.updatePosition());
  }

  private updatePosition() {
    const element = this.el.nativeElement;
    const rect = element.getBoundingClientRect();
    const container = (this.anchorContainer ?? document.body);
    const containerRect = container.getBoundingClientRect();

    // Calculate position in content-space coordinates (stable regardless of scroll)
    const scrollTop = container === document.body ? window.scrollY : container.scrollTop;
    const relativeTop = rect.top - containerRect.top + scrollTop;
    // console.log('rect top: ', rect.top, ' container top: ', containerRect.top, ' scrollTop: ', scrollTop, ' offset: ', relativeTop);

    let pos = Number.parseInt(this.arrayPosition);
    this.anchorService.updatePosition(this.anchorId, relativeTop, pos);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.ro?.disconnect();
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
