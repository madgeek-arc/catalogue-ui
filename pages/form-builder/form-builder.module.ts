import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { NgSelectModule } from "@ng-select/ng-select";
import { FormsModule } from "@angular/forms";
import { FieldBuilderComponent } from "./field-builder/field-builder.component";
import { CKEditorModule } from "@ckeditor/ckeditor5-angular";
import { TypeSelectorComponent } from "./type-selector-builder/type-selector.component";
import { ChapterSettingsComponent } from "./settings-side-menu/chapter-settings/chapter-settings.component";
import { DynamicFormModule } from "../dynamic-form/dynamic-form.module";
import {
  CatalogueUiReusableComponentsModule
} from "../../shared/reusable-components/catalogue-ui-reusable-components.module";
import { CatalogueUiSharedModule } from "../../shared/catalogue-ui-shared.module";
import { SafeUrlPipe } from "../../shared/pipes/safeUrlPipe";


@NgModule({
  declarations: [
    FieldBuilderComponent,
    TypeSelectorComponent
  ],
  imports: [
    CommonModule,
    NgSelectModule,
    FormsModule,
    CKEditorModule,
    DynamicFormModule,
    CatalogueUiReusableComponentsModule,
    CatalogueUiSharedModule,
    SafeUrlPipe,
    ChapterSettingsComponent,
  ],
  providers: []
})

export class FormBuilderModule {}
