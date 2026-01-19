import { Directive, ElementRef, EventEmitter, Input, AfterViewInit, OnDestroy, Output, NgZone } from '@angular/core';


@Directive({
  selector: '[measureComment]'
})
export class MeasureCommentDirective implements AfterViewInit, OnDestroy {
  @Input() threadId!: string;
  @Output() sizeChange = new EventEmitter<number>();

  private ro!: ResizeObserver;

  constructor(private el: ElementRef<HTMLElement>, private ngZone: NgZone) {}

  ngAfterViewInit() {
    // measure initially
    this.emitSize();

    // watch for resizes (content changes)
    this.ngZone.runOutsideAngular(() => {
      this.ro = new ResizeObserver(() => {
        this.ngZone.run(() => this.emitSize());
      });
      this.ro.observe(this.el.nativeElement);
    });
  }

  private emitSize() {
    const h = Math.round(this.el.nativeElement.getBoundingClientRect().height);
    this.sizeChange.emit(h);
  }

  ngOnDestroy() {
    this.ro?.disconnect();
  }
}
