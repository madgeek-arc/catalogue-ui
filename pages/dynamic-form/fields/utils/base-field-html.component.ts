import {
  AfterViewInit,
  Component, DestroyRef,
  ElementRef,
  EventEmitter,
  HostListener, inject,
  Input, NgZone, OnDestroy, OnInit,
  Output,
  ViewChild
} from "@angular/core";
import { Field } from "../../../../domain/dynamic-form-model";
import { ReactiveFormsModule, UntypedFormGroup } from "@angular/forms";
import { JsonPipe, NgClass, NgIf } from "@angular/common";
import { SafeUrlPipe } from "../../../../shared/pipes/safeUrlPipe";
import {
  CatalogueUiReusableComponentsModule
} from "../../../../shared/reusable-components/catalogue-ui-reusable-components.module";
import { CommentingWebsocketService } from "../../../../services/commenting-websocket.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Thread } from "../../../../domain/comment.model";

@Component({
  selector: 'app-base-field-html',
  templateUrl: './base-field-html.component.html',
  imports: [
    ReactiveFormsModule,
    NgClass,
    NgIf,
    SafeUrlPipe,
    CatalogueUiReusableComponentsModule,
    JsonPipe
  ]
})

export class BaseFieldHtmlComponent implements OnInit, AfterViewInit, OnDestroy {
  private ngZone = inject(NgZone);
  private destroyRef = inject(DestroyRef);
  private commentingService = inject(CommentingWebsocketService);

  @ViewChild('refEl') refEl!: ElementRef;
  @ViewChild('floatingEl') floatingEl!: ElementRef;

  @Input() form!: UntypedFormGroup;
  @Input() fieldData: Field;
  @Input() editMode: boolean;
  @Input() readonly = false;
  @Input() hideField: boolean;

  @Output() emitPush: EventEmitter<void> = new EventEmitter();

  private ticking = false;
  threads: Thread[] = [];

  ngOnInit() {
    this.commentingService.threadSubject.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(thread => {

      this.threads = thread.filter(element => element.fieldId === this.fieldData.id);
    });
  }

  ngAfterViewInit() {
    setTimeout(() => this.repositionFloating(), 10000);
    this.ngZone.runOutsideAngular(() => {
      window.addEventListener('scroll', this.onScroll, true);
      window.addEventListener('resize', this.onResize, true);
    });
    // this.repositionFloating();
  }


  ngOnDestroy() {
    window.removeEventListener('scroll', this.onScroll, true);
    window.removeEventListener('resize', this.onResize, true);
  }

  onScroll = () => {
    this.requestUpdate();
  }

  onResize = () => {
    this.requestUpdate();
  }

  requestUpdate() {
    if (!this.ticking) {
      requestAnimationFrame(() => {
        this.repositionFloating();
        this.ticking = false;
      });
      this.ticking = true;
    }
  }


  repositionFloating() {
    if (!this.refEl || !this.refEl.nativeElement || !this.floatingEl || !this.floatingEl.nativeElement) {
      return;
    }

    const rect = this.refEl.nativeElement.getBoundingClientRect();

    // The element’s top relative to the viewport
    const top = rect.top + 10;

    // Apply top style to the floating element
    this.floatingEl.nativeElement.style.top = `${top}px`;
  }

  appendAsterisk(content: string): string {
    const closingTag = '</p>';

    if (content.trim().endsWith(closingTag)) // Insert (*) before the </p>
      return content.replace(/<\/p>\s*$/, ' (*)</p>');
    else // Just append (*) at the end
      return content + ' (*)';
  }

  push() {
    this.emitPush.emit();
  }

}
