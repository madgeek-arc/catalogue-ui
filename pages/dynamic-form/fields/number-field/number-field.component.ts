import { Component, EventEmitter, OnInit, Output } from "@angular/core";
import { Field, FieldType, HandleBitSet, NumberProperties } from "../../../../domain/dynamic-form-model";
import { BaseFieldComponent } from "../utils/base-field.component";

@Component({
    selector: 'app-number-field',
    templateUrl: './number-field.component.html',
    standalone: false
})

export class NumberFieldComponent extends BaseFieldComponent implements OnInit {

  @Output() handleBitSets = new EventEmitter<Field>();
  @Output() handleBitSetsOfComposite = new EventEmitter<HandleBitSet>();

  step: string = '';
  properties: NumberProperties = new NumberProperties();

  ngOnInit() {
    super.ngOnInit();
    if (this.fieldData.typeInfo.type === FieldType.number) {
      this.properties = this.fieldData.typeInfo.properties as NumberProperties;
      if (this.properties.decimals) {
        this.step = '0.' + '0'.repeat((this.fieldData.typeInfo.properties as NumberProperties).decimals - 1) + '1';
      }
    }
  }

  /** Bitsets--> **/
  updateBitSet(fieldData: Field) {
    if (fieldData.form.mandatory) {
      this.handleBitSets.emit(fieldData);
    }
  }

}
