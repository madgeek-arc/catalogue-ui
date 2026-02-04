import { Component } from "@angular/core";
import { BaseFieldComponent } from "../../utils/base-field.component";
import { BaseFieldHtmlComponent } from "../../utils/base-field-html.component";
import { ReactiveFormsModule } from "@angular/forms";
import { NgSelectComponent } from "@ng-select/ng-select";
import { NgClass } from "@angular/common";

@Component({
  selector: 'app-select-field',
  templateUrl: './select-field.component.html',
  imports: [
    BaseFieldHtmlComponent,
    ReactiveFormsModule,
    NgSelectComponent,
    NgClass
  ]
})

export class SelectFieldComponent extends BaseFieldComponent {

}
