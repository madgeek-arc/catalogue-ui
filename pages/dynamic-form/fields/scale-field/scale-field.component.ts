import { Component, EventEmitter, Output } from "@angular/core";
import { CustomProperties, Field, HandleBitSet } from "../../../../domain/dynamic-form-model";
import { BaseFieldComponent } from "../utils/base-field.component";
import { BaseFieldHtmlComponent } from "../utils/base-field-html.component";
import { ReactiveFormsModule } from "@angular/forms";
import { NgClass } from "@angular/common";

@Component({
  selector: 'app-scale-field',
  templateUrl: 'scale-field.component.html',
  styleUrls: ['scale-field.component.scss'],
  imports: [
    BaseFieldHtmlComponent,
    ReactiveFormsModule,
    NgClass
  ]
})

export class ScaleFieldComponent extends BaseFieldComponent {

  @Output() handleBitSets = new EventEmitter<Field>();
  @Output() handleBitSetsOfComposite = new EventEmitter<HandleBitSet>();

  text_left: string | null = null;
  text_right: string | null = null;

  ngOnInit() {
    super.ngOnInit();
    const properties = this.fieldData.typeInfo.properties as CustomProperties;

    if (properties && 'textLeft' in properties) {
      this.text_left = properties.textLeft;
      console.log(this.text_left);
    }

    if (properties && 'textRight' in properties) {
      this.text_right = properties.textRight;
    }
  }
}
