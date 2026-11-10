import { NgModule } from "@angular/core";
import { CompareSurveysComponent } from "./surveys/compare-surveys.component";

/**
 * Compatibility wrapper for hosts that still import NgModules. The component is standalone, new code imports it
 * directly.
 */
@NgModule({
  imports: [
    CompareSurveysComponent
  ],
  exports: [
    CompareSurveysComponent
  ]
})

export class CompareModule {}
