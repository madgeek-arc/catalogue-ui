import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { NgSelectModule } from "@ng-select/ng-select";
import { FormsModule } from "@angular/forms";
import { CKEditorModule } from "@ckeditor/ckeditor5-angular";
import { DynamicFormModule } from "../dynamic-form/dynamic-form.module";
import {
  CatalogueUiReusableComponentsModule
} from "../../shared/reusable-components/catalogue-ui-reusable-components.module";
import { CatalogueUiSharedModule } from "../../shared/catalogue-ui-shared.module";


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    NgSelectModule,
    FormsModule,
    CKEditorModule,
    DynamicFormModule,
    CatalogueUiReusableComponentsModule,
    CatalogueUiSharedModule,
  ],
  providers: []
})

export class FormBuilderModule {}
