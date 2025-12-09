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
    });

    // Initial position
    setTimeout(() => this.updatePosition(), 0);
    // this.updatePosition();
  }

  private updatePosition() {
    // const element = this.el.nativeElement;
    const rect = this.el.nativeElement.getBoundingClientRect();
    const containerRect = (this.anchorContainer ?? document.body).getBoundingClientRect();
    const relativeTop = rect.top - containerRect.top;
    // console.log('rect top: ', rect.top, ' container top: ', containerRect.top, ' offset: ', relativeTop);

    let pos = Number.parseInt(this.arrayPosition);
    this.anchorService.updatePosition(this.anchorId, relativeTop, pos);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
