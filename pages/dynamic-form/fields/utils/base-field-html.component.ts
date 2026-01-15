import {
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  input,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges
} from "@angular/core";
import { Field } from "../../../../domain/dynamic-form-model";
import { FormsModule, ReactiveFormsModule, UntypedFormGroup } from "@angular/forms";
import { NgClass } from "@angular/common";
import { SafeUrlPipe } from "../../../../shared/pipes/safeUrlPipe";
import {
  CatalogueUiReusableComponentsModule
} from "../../../../shared/reusable-components/catalogue-ui-reusable-components.module";
import { CommentAnchorDirective } from "../../../../shared/directives/comment-anchor.directive";
import { CommentingWebsocketService } from "../../../../services/commenting-websocket.service";
import * as UIkit from 'uikit';
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
  selector: 'app-base-field-html',
  templateUrl: './base-field-html.component.html',
  imports: [
    ReactiveFormsModule,
    NgClass,
    SafeUrlPipe,
    CommentAnchorDirective,
    CatalogueUiReusableComponentsModule,
    FormsModule
  ]
})

export class BaseFieldHtmlComponent implements OnInit, OnChanges {
  private destroyRef = inject(DestroyRef);
  private commentingService = inject(CommentingWebsocketService);

  @Input() form!: UntypedFormGroup;
  @Input() fieldData: Field;
  @Input() editMode: boolean;
  @Input() readonly = false;
  @Input() hideField: boolean;
  @Input() scrollContainer: HTMLElement | null = null;
  @Input() inputId?: string;

  @Output() emitPush: EventEmitter<void> = new EventEmitter();

  label: string = '';
  comment: string = '';
  position?: string;
  hasComment: boolean = false;
  commentFocused: boolean = false;

  ngOnInit(): void {

    this.commentingService.threadSubject.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: value => {
        if (value.some((item) => item.fieldId === this.fieldData.id)) {
          this.hasComment = true;
          this.label = this.highlight();
        } else {
          this.hasComment = false;
          if (this.label)
            this.label = this.removeHighlight();
        }
      }
    });

    this.commentingService.focusedField.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: value => {
       if (value === this.fieldData.id) {
         this.label = this.strongHighlightToggle(true);
         this.commentFocused = true;
       } else {
         this.label = this.strongHighlightToggle(false);
         this.commentFocused = false;
       }
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['inputId']) {
      let matches = this.inputId?.match(/\[(.*?)\]/g);  // all matches
      this.position = matches ? matches[matches.length - 1].replace(/[\[\]]/g, "") : null;
    }

    if (changes['fieldData']) {
      if (this.fieldData.form.mandatory)
        this.label = this.appendAsterisk(this.fieldData.label.text);
      else
        this.label = this.fieldData.label.text;
    }
  }

  appendAsterisk(content: string): string {
    const closingTag = '</p>';

    if (content.trim().endsWith(closingTag)) // Insert (*) before the </p>
      return content.replace(/<\/p>\s*$/, ' (*)</p>');
    else // Just append (*) at the end
      return content + ' (*)';
  }

  removeHighlight() {
    if (this.label.includes('label-highlight-strong')) {
      return this.label.replace(/<span class="label-highlight-strong">(.*?)<\/span>/g, '$1');
    } else if (this.label.includes('label-highlight')) {
      return this.label.replace(/<span class="label-highlight">(.*?)<\/span>/g, '$1');
    }
    return this.label;
  }

  highlight() {
    const openingTag = '<p>';
    const closingTag = '</p>';
    if (this.label.trim().startsWith(openingTag)) {
      let tmp = this.label.replace(openingTag, `${openingTag}<span class="label-highlight">`);
      return tmp.replace(closingTag, `</span>${closingTag}`);
    } else {
      return `<span class="label-highlight">${this.label}</span>`;
    }
  }

  strongHighlightToggle(strong: boolean) {
    if (strong) {
      if (this.commentFocused)
        return this.label;

      return this.label.replace('label-highlight', 'label-highlight-strong');
    } else
      return this.label?.replace('label-highlight-strong', 'label-highlight');
  }

  push() {
    this.emitPush.emit();
  }

  createThread() {
    if (!this.comment) {
      UIkit.notification({message: 'Please enter a comment', status: 'warning'});
      return;
    }
    console.log('createThread');
    console.log(this.fieldData.id);
    this.commentingService.addThread(this.fieldData.id, this.comment);
    UIkit.modal(`#comment-modal-${this.fieldData.id}`).hide();
  }

  protected readonly input = input;
}
