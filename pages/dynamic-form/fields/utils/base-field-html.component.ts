import { Component, EventEmitter, inject, Input, Output } from "@angular/core";
import { Field } from "../../../../domain/dynamic-form-model";
import { ReactiveFormsModule, UntypedFormGroup } from "@angular/forms";
import { NgClass, NgIf } from "@angular/common";
import { SafeUrlPipe } from "../../../../shared/pipes/safeUrlPipe";
import {
  CatalogueUiReusableComponentsModule
} from "../../../../shared/reusable-components/catalogue-ui-reusable-components.module";
import { CommentAnchorDirective } from "../../../../shared/directives/comment-anchor.directive";
import { CommentingWebsocketService } from "../../../../services/commenting-websocket.service";

@Component({
  selector: 'app-base-field-html',
  templateUrl: './base-field-html.component.html',
  imports: [
    ReactiveFormsModule,
    NgClass,
    NgIf,
    SafeUrlPipe,
    CommentAnchorDirective,
    CatalogueUiReusableComponentsModule
  ]
})

export class BaseFieldHtmlComponent {
  private commentingService = inject(CommentingWebsocketService);

  @Input() form!: UntypedFormGroup;
  @Input() fieldData: Field;
  @Input() editMode: boolean;
  @Input() readonly = false;
  @Input() hideField: boolean;
  @Input() scrollContainer: HTMLElement | null = null;

  @Output() emitPush: EventEmitter<void> = new EventEmitter();

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

  createThread() {
    console.log('createThread');
    console.log(this.fieldData.id);
  }

}
