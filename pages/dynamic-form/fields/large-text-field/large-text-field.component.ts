import { Component, EventEmitter, OnInit, Output } from "@angular/core";
import { Field, HandleBitSet, TextProperties } from "../../../../domain/dynamic-form-model";
import { BaseFieldComponent } from "../utils/base-field.component";

@Component({
    selector: 'app-large-text-field',
    templateUrl: './large-text-field.component.html',
    standalone: false
})

export class LargeTextFieldComponent extends BaseFieldComponent implements OnInit {

  @Output() handleBitSets = new EventEmitter<Field>();
  @Output() handleBitSetsOfComposite = new EventEmitter<HandleBitSet>();

  maxLength: number | null = null;

  ngOnInit() {
    super.ngOnInit();
    this.maxLength = (this.fieldData.typeInfo.properties as TextProperties).maxLength;
  }


  /** Bitsets--> **/

  updateBitSet(fieldData: Field) {
    this.timeOut(200).then(() => { // Needed for radio buttons strange behaviour
      if (fieldData.form.mandatory) {
        this.handleBitSets.emit(fieldData);
      }
    });
  }

}

