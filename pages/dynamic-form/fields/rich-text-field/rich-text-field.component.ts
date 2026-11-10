import { Component, EventEmitter, OnChanges, OnInit, Output, SimpleChanges, ChangeDetectionStrategy } from "@angular/core";
import { Field, HandleBitSet } from "../../../../domain/dynamic-form-model";
import { BaseFieldComponent } from "../utils/base-field.component";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { BaseFieldHtmlComponent } from "../utils/base-field-html.component";
import { NgClass } from "@angular/common";
import { SortableDirective } from "../../../../shared/directives/sortable.directive";
import { RichTextEditorComponent } from "../../../../shared/reusable-components/rich-text-editor/rich-text-editor.component";

@Component({
    selector: 'app-rich-text-field',
    templateUrl: './rich-text-field.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [FormsModule, ReactiveFormsModule, BaseFieldHtmlComponent, NgClass, SortableDirective, RichTextEditorComponent]
})

export class RichTextFieldComponent extends BaseFieldComponent implements OnInit, OnChanges {

  @Output() handleBitSets = new EventEmitter<Field>();
  @Output() handleBitSetsOfComposite = new EventEmitter<HandleBitSet>();

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
