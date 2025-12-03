import { Directive, ElementRef, Input, AfterViewInit, OnDestroy, NgZone } from '@angular/core';
import { fromEvent, Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { CommentAnchorService } from "../../services/comment-anchor.service";

@Directive({
  standalone: true,
  selector: '[commentAnchor]'
})
export class CommentAnchorDirective implements AfterViewInit, OnDestroy {
  @Input('commentAnchor') anchorId!: string;
  @Input() anchorContainer?: HTMLElement; // optional explicit container

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
    this.updatePosition();
  }

  private updatePosition() {
    const element = this.el.nativeElement;
    const rect = element.getBoundingClientRect();
    const containerRect = (this.anchorContainer ?? document.body).getBoundingClientRect();

    const relativeTop = rect.top - containerRect.top;

    this.anchorService.updatePosition(this.anchorId, relativeTop);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
