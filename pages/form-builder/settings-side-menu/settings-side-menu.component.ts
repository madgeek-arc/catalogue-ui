import { Component, EventEmitter, Input, Output } from "@angular/core";
import { Field, Section } from "../../../domain/dynamic-form-model";
import { SelectedSection } from "../form-builder.component";

@Component({
  selector: 'app-settings-side-menu',
  templateUrl: './settings-side-menu.component.html',
})

export class SettingsSideMenuComponent {
  @Input() chapter: Section | null = null;
  @Input() section: Section | null = null;
  @Input() field: Field | null = null;
  @Input() sideMenuSettingsType: typeof SelectedSection.prototype.sideMenuSettingsType = 'main';

  @Output() emitSideMenuSettingsChange = new EventEmitter<typeof SelectedSection.prototype.sideMenuSettingsType>();
  @Output() emitField = new EventEmitter<Field>();
  @Output() emitFieldReferenceChange = new EventEmitter<void>();

  fieldSettings(position: number) {
    this.field = this.section.fields[position];
    console.log(this.field.id);
    this.emitSideMenuSettingsChange.emit('field');
    this.emitField.emit(this.field);
  }

  updateFieldReference() {
    if (this.field.typeInfo.type === 'richText') {
      this.emitFieldReferenceChange.emit();
    }

    return;
  }

}
