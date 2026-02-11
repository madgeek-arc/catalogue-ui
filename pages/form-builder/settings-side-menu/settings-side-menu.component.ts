import { Component, EventEmitter, inject, Input, Output } from "@angular/core";
import { Field, Section, SelectedSection } from "../../../domain/dynamic-form-model";
import { ChapterSettingsComponent } from "./chapter-settings/chapter-settings.component";
import { SectionSettingsComponent } from "./section-settings/section-settings.component";
import { FieldSettingsComponent } from "./field-settings/field-settings.component";
import { FieldTypeSelectorComponent } from "./field-type-selection/field-type-selector.component";
import { FormBuilderService } from "../../../services/form-builder.service";

@Component({
  selector: 'app-settings-side-menu',
  templateUrl: './settings-side-menu.component.html',
  imports: [
    ChapterSettingsComponent,
    SectionSettingsComponent,
    FieldSettingsComponent,
    FieldTypeSelectorComponent
  ]
})

export class SettingsSideMenuComponent {
  protected fbService = inject(FormBuilderService);

  @Input() section: Section | null = null;
  @Input() field: Field | null = null;

  @Output() emitSideMenuSettingsChange = new EventEmitter<typeof SelectedSection.prototype.sideMenuSettingsType>();
  @Output() emitFieldReferenceChange = new EventEmitter<void>();
  @Output() emitField = new EventEmitter<Field>();

  // fieldSettings(position: number) {
  //   this.field = this.section.fields[position];
  //   console.log(this.field.id);
  //   this.emitSideMenuSettingsChange.emit('field');
  //   this.emitField.emit(this.field);
  // }

  updateFieldReference() {
    if (this.field.typeInfo.type === 'richText') {
      this.emitFieldReferenceChange.emit();
    }

    return;
  }

}
