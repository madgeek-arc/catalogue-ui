import {NgModule} from "@angular/core";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {LandingPageComponent} from "./pages/landingpages/dataset/landing-page.component";
import {DynamicFormModule} from "./pages/dynamic-form/dynamic-form.module";
import {ReusableComponentsModule} from "./shared/reusable-components/reusable-components.module";
import {CommonModule} from "@angular/common";
import {SearchComponent} from "./pages/search/search.component";
import {RouterModule} from "@angular/router";
import {FormBuilderModule} from "./pages/form-builder/form-builder.module";
import {PrintToPdfComponent} from "./pages/printToPDF/print-to-pdf.component";

@NgModule({
  declarations: [
    SearchComponent,
    LandingPageComponent,
    PrintToPdfComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    ReusableComponentsModule,
    DynamicFormModule,
    FormBuilderModule
  ],
  providers: [],
  exports: [
    PrintToPdfComponent
  ]
})

export class CatalogueUiModule { }
