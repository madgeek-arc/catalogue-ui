import { Component, EventEmitter, Output } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { NgClass } from "@angular/common";
import { BaseFieldComponent } from "../utils/base-field.component";
import { BaseFieldHtmlComponent } from "../utils/base-field-html.component";
import { CustomProperties, Field, HandleBitSet } from "../../../../domain/dynamic-form-model";

@Component({
  selector: 'app-checkbox-field',
  imports: [
    ReactiveFormsModule,
    NgClass,
    BaseFieldHtmlComponent
  ],
  templateUrl: './checkbox-field.component.html'
})

export class CheckboxFieldComponent extends BaseFieldComponent {

  @Output() handleBitSets = new EventEmitter<Field>();
  @Output() handleBitSetsOfComposite = new EventEmitter<HandleBitSet>();

  label?: string;
  properties: CustomProperties = {};

  ngOnInit() {
    super.ngOnInit();
    this.properties = this.fieldData.typeInfo.properties as CustomProperties;
    if (this.properties.hasOwnProperty('label'))
      this.label = this.properties.label as string;
  }

  /** Bitsets--> **/

  updateBitSet(fieldData: Field) {
    this.timeOut(200).then(() => { // Needed for radio buttons strange behavior
      if (fieldData.form.mandatory) {
        this.handleBitSets.emit(fieldData);
      }
    });
  }
}
