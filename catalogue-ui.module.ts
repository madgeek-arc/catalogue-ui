import {NgModule} from "@angular/core";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {LandingPageComponent} from "./pages/landingpages/dataset/landing-page.component";
import {DynamicFormModule} from "./pages/dynamic-form/dynamic-form.module";
import {ReusableComponentsModule} from "./shared/reusable-components/reusable-components.module";
import {CommonModule} from "@angular/common";
import {SearchComponent} from "./pages/search/search.component";
import {RouterModule} from "@angular/router";

@NgModule({
  declarations: [
    SearchComponent,
    LandingPageComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    ReusableComponentsModule,
    DynamicFormModule,
  ],
  providers: [],
})

export class CatalogueUiModule { }
