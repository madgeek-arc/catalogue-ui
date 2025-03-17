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


  fieldSettings(position: number) {
    this.field = this.section.fields[position];
    this.sideMenuSettingsType = 'field';
  }

}
