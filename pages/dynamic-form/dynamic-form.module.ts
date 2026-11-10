import { NgModule } from "@angular/core";
import { ChapterComponent } from "./chapter.component";
import { DynamicFormFieldsComponent } from "./fields/dynamic-form-fields.component";
import { SurveyComponent } from "./survey.component";

/**
 * Compatibility wrapper for hosts that still import NgModules. The components are standalone, new code imports them
 * directly.
 */
@NgModule({
  imports: [
    ChapterComponent,
    SurveyComponent,
    DynamicFormFieldsComponent
  ],
  exports: [
    ChapterComponent,
    SurveyComponent,
    DynamicFormFieldsComponent
  ]
})

export class DynamicFormModule {}
