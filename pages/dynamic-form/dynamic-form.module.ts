import {NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {DynamicFormComponent} from "./dynamic-form.component";
import {DynamicFormFieldsComponent} from "./dynamic-form-fields.component";
import {DynamicFormEditComponent} from "./dynamic-form-edit.component";
import {LMarkdownEditorModule} from "ngx-markdown-editor";
import {NgSelectModule} from "@ng-select/ng-select";

@NgModule({
  declarations: [
    DynamicFormFieldsComponent,
    DynamicFormComponent,
    DynamicFormEditComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    LMarkdownEditorModule,
    NgSelectModule,
  ],
})

export class DynamicFormModule { }
