import { Component, EventEmitter, Output, ChangeDetectionStrategy } from "@angular/core";
import { Field, HandleBitSet } from "../../../../domain/dynamic-form-model";
import { BaseFieldComponent } from "../utils/base-field.component";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { BaseFieldHtmlComponent } from "../utils/base-field-html.component";
import { NgClass } from "@angular/common";
import { SortableDirective } from "../../../../shared/directives/sortable.directive";

@Component({
    selector: 'app-string-url-email-field',
    templateUrl: './string-field.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, ReactiveFormsModule, BaseFieldHtmlComponent, NgClass, SortableDirective]
})

export class StringFieldComponent extends BaseFieldComponent {

  @Output() handleBitSets = new EventEmitter<Field>();
  @Output() handleBitSetsOfComposite = new EventEmitter<HandleBitSet>();

  /** Bitsets--> **/

  updateBitSet(fieldData: Field) {
    this.timeOut(200).then(() => { // Needed for radio buttons strange behaviour
      if (fieldData.form.mandatory) {
        this.handleBitSets.emit(fieldData);
      }
    });
  }

}
