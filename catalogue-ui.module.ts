import { NgModule } from "@angular/core";
import { DynamicFormModule } from "./pages/dynamic-form/dynamic-form.module";

/**
 * Compatibility wrapper for hosts that still import NgModules: it exports the form renderer. The components are
 * standalone, new code imports them directly.
 */
@NgModule({
  imports: [
    DynamicFormModule
  ],
  exports: [
    DynamicFormModule
  ]
})

export class CatalogueUiModule { }
