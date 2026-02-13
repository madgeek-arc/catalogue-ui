import { Component, EventEmitter, inject, Input, Output } from "@angular/core";
import { Field, Section, SelectedSection } from "../../../domain/dynamic-form-model";
import { ChapterSettingsComponent } from "./chapter-settings/chapter-settings.component";
import { SectionSettingsComponent } from "./section-settings/section-settings.component";
import { FieldSettingsComponent } from "./field-settings/field-settings.component";
import { FieldTypeSelectorComponent } from "./field-type-selection/field-type-selector.component";
import { FormBuilderService } from "../../../services/form-builder.service";
import { MainSettingsComponent } from "./main-settings/main-settings.component";

@Component({
  selector: 'app-settings-side-menu',
  templateUrl: './settings-side-menu.component.html',
  imports: [
    ChapterSettingsComponent,
    SectionSettingsComponent,
    FieldSettingsComponent,
    FieldTypeSelectorComponent,
    MainSettingsComponent
  ]
})

export class SettingsSideMenuComponent {
  protected fbService = inject(FormBuilderService);

  @Input() field: Field | null = null;

  @Output() emitFieldReferenceChange = new EventEmitter<void>();

  updateFieldReference() {
    if (this.field.typeInfo.type === 'richText') {
      this.emitFieldReferenceChange.emit();
    }

    return;
  }

}
