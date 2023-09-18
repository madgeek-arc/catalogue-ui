import {NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {DynamicFormFieldsComponent} from "./fields/dynamic-form-fields.component";
import {ChapterEditComponent} from "./chapter-edit.component";
import {NgSelectModule} from "@ng-select/ng-select";
import {CompositeFieldComponent} from "./fields/composite-field/composite-field.component";
import {StringFieldComponent} from "./fields/string-field/string-field.component";
import {VocabularyFieldComponent} from "./fields/dropdown-field/vocabulary-field.component";
import {CheckboxFieldComponent} from "./fields/checkbox-field/checkbox-field.component";
import {LargeTextFieldComponent} from "./fields/large-text-field/large-text-field.component";
import {RadioButtonFieldComponent} from "./fields/radio-button-field/radio-button-field.component";
import {DateFieldComponent} from "./fields/date-field/date-field.component";
import {DpDatePickerModule} from "ng2-date-picker";
import {RadioGridFieldComponent} from "./fields/radio-grid-field/radio-grid-field.component";
import {SurveyComponent} from "./survey.component";
import {NumberFieldComponent} from "./fields/number-field/number-field.component";
import {ReusableComponentsModule} from "../../shared/reusable-components/reusable-components.module";
import {RichTextFieldComponent} from "./fields/rich-text-field/rich-text-field.component";
import {CKEditorModule} from "@ckeditor/ckeditor5-angular";
import {ChooseOneComponent} from "./fields/choose-one-composite/choose-one.component";
import {CatalogueUiSharedModule} from "../../shared/catalogue-ui-shared.module";

@NgModule({
    declarations: [
      StringFieldComponent,
      CompositeFieldComponent,
      DynamicFormFieldsComponent,
      ChapterEditComponent,
      VocabularyFieldComponent,
      CheckboxFieldComponent,
      RadioButtonFieldComponent,
      DateFieldComponent,
      LargeTextFieldComponent,
      RichTextFieldComponent,
      RadioGridFieldComponent,
      NumberFieldComponent,
      ChooseOneComponent,
      SurveyComponent
    ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgSelectModule,
    DpDatePickerModule,
    ReusableComponentsModule,
    CKEditorModule,
    CatalogueUiSharedModule,
  ],
  exports: [
    ChapterEditComponent,
    SurveyComponent,
    DynamicFormFieldsComponent
  ]
})

export class DynamicFormModule { }
