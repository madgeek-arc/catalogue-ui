import {NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {DynamicFormComponent} from "./dynamic-form.component";
import {DynamicFormFieldsComponent} from "./dynamic-form-fields.component";
import {DynamicFormEditComponent} from "./dynamic-form-edit.component";
import {LMarkdownEditorModule} from "ngx-markdown-editor";
import {NgSelectModule} from "@ng-select/ng-select";
import {CompositeFieldComponent} from "./fields/composite-field/composite-field.component";
import {StringFieldComponent} from "./fields/string-field/string-field.component";
import {VocabularyFieldComponent} from "./fields/dropdown-field/vocabulary-field.component";
import {CheckboxFieldComponent} from "./fields/checkbox-field/checkbox-field.component";
import {LargeTextComponent} from "./fields/large-text/large-text.component";
import {RadioButtonFieldComponent} from "./fields/radio-button-field/radio-button-field.component";
import {DateFieldComponent} from "./fields/date-field/date-field.component";
import {DpDatePickerModule} from "ng2-date-picker";

@NgModule({
    declarations: [
        StringFieldComponent,
        CompositeFieldComponent,
        DynamicFormFieldsComponent,
        DynamicFormComponent,
        DynamicFormEditComponent,
        VocabularyFieldComponent,
        CheckboxFieldComponent,
        RadioButtonFieldComponent,
        DateFieldComponent,
        LargeTextComponent
    ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    LMarkdownEditorModule,
    NgSelectModule,
    DpDatePickerModule,
  ],
  exports: [
    DynamicFormComponent,
    DynamicFormEditComponent
  ]
})

export class DynamicFormModule { }
