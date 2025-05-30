import { Component, EventEmitter, OnChanges, OnInit, Output, SimpleChanges } from "@angular/core";
import { Field, HandleBitSet } from "../../../../domain/dynamic-form-model";
import { BaseFieldComponent } from "../utils/base-field.component";
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import editor from "@ckeditor/ckeditor5-build-classic";

@Component({
  selector: 'app-rich-text-field',
  templateUrl: './rich-text-field.component.html'
})

export class RichTextFieldComponent extends BaseFieldComponent implements OnInit, OnChanges {

  @Output() handleBitSets = new EventEmitter<Field>();
  @Output() handleBitSetsOfComposite = new EventEmitter<HandleBitSet>();

  public editor = ClassicEditor;

  ngOnChanges(changes: SimpleChanges) {
    // console.log(changes);
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
