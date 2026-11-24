import { Component, EventEmitter, OnInit, Output, ChangeDetectionStrategy } from "@angular/core";
import { Field, HandleBitSet } from "../../../../domain/dynamic-form-model";
import { BaseFieldComponent } from "../utils/base-field.component";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { BaseFieldHtmlComponent } from "../utils/base-field-html.component";
import { NgClass } from "@angular/common";

@Component({
    selector: 'app-radio-button-field',
    templateUrl: './radio-button-field.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, ReactiveFormsModule, BaseFieldHtmlComponent, NgClass]
})

export class RadioButtonFieldComponent extends BaseFieldComponent implements OnInit {

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
