import {Component, EventEmitter, OnInit, Output} from "@angular/core";
import { Field, HandleBitSet, NumberProperties } from "../../../../domain/dynamic-form-model";
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

  ngOnInit() {
    super.ngOnInit();

    if ((this.fieldData.typeInfo.properties as NumberProperties).decimals) {
      this.step = '0.' + '0'.repeat((this.fieldData.typeInfo.properties as NumberProperties).decimals - 1) + '1';
    }
  }

  /** check fields validity--> **/

  // checkFormValidity(): boolean {
  //   return !( this.formControl.valid || this.formControl.pristine);
  // }

  /** Bitsets--> **/
  updateBitSet(fieldData: Field) {
    if (fieldData.form.mandatory) {
      this.handleBitSets.emit(fieldData);
    }
  }

  /** other stuff--> **/
  getNumberOfDecimals() {
    if ((this.fieldData.typeInfo.properties as NumberProperties).decimals) {
      return (this.fieldData.typeInfo.properties as NumberProperties).decimals;
    }
    return 0
  }

}
