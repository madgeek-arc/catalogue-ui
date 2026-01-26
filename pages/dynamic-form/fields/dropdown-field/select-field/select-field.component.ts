import { Component } from "@angular/core";
import { BaseFieldComponent } from "../../utils/base-field.component";
import { BaseFieldHtmlComponent } from "../../utils/base-field-html.component";
import { ReactiveFormsModule } from "@angular/forms";
import { NgSelectComponent } from "@ng-select/ng-select";

@Component({
  selector: 'app-select-field',
  templateUrl: './select-field.component.html',
  imports: [
    BaseFieldHtmlComponent,
    ReactiveFormsModule,
    NgSelectComponent
  ]
})

export class SelectFieldComponent extends BaseFieldComponent {

}
