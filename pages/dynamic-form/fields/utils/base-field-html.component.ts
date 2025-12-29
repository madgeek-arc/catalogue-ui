import { Component, EventEmitter, Input, Output } from "@angular/core";
import { Field } from "../../../../domain/dynamic-form-model";
import { ReactiveFormsModule, UntypedFormGroup } from "@angular/forms";
import { NgClass } from "@angular/common";
import { SafeUrlPipe } from "../../../../shared/pipes/safeUrlPipe";
import {
  CatalogueUiReusableComponentsModule
} from "../../../../shared/reusable-components/catalogue-ui-reusable-components.module";

@Component({
  selector: 'app-base-field-html',
  templateUrl: './base-field-html.component.html',
  imports: [
    ReactiveFormsModule,
    NgClass,
    SafeUrlPipe,
    CatalogueUiReusableComponentsModule
]
})

export class BaseFieldHtmlComponent {
  @Input() form!: UntypedFormGroup;
  @Input() fieldData: Field;
  @Input() editMode: boolean;
  @Input() readonly = false;
  @Input() hideField: boolean;

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

}
