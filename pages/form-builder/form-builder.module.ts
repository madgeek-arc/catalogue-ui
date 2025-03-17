import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormBuilderComponent } from "./form-builder.component";
import { NgSelectModule } from "@ng-select/ng-select";
import { FormsModule } from "@angular/forms";
import { SideMenuComponent } from "./side-menu/side-menu.component";
import { FieldBuilderComponent } from "./field-builder/field-builder.component";
import { CKEditorModule } from "@ckeditor/ckeditor5-angular";
import { TypeSelectorComponent } from "./type-selector-builder/type-selector.component";
import { MainInfoComponent } from "./main-info/main-info.component";
import { ChapterSettingsComponent } from "./settings-side-menu/chapter-settings/chapter-settings.component";
import { SettingsSideMenuComponent } from "./settings-side-menu/settings-side-menu.component";
import { SectionSettingsComponent } from "./settings-side-menu/section-settings/section-settings.component";
import { FieldTypeSelectionComponent } from "./settings-side-menu/field-type-selection/field-type-selection.component";
import { FieldSettingsComponent } from "./settings-side-menu/field-settings/field-settings.component";


@NgModule({
  declarations: [
    FormBuilderComponent,
    SideMenuComponent,
    SettingsSideMenuComponent,
    MainInfoComponent,
    ChapterSettingsComponent,
    SectionSettingsComponent,
    FieldSettingsComponent,
    FieldTypeSelectionComponent,
    FieldBuilderComponent,
    TypeSelectorComponent
  ],
  imports: [
    CommonModule,
    NgSelectModule,
    FormsModule,
    CKEditorModule
  ],
})

export class FormBuilderModule {}
