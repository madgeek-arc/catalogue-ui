import { Component, Input } from "@angular/core";
import { Section } from "../../../domain/dynamic-form-model";
import { SelectedSection } from "../form-builder.component";

@Component({
  selector: 'app-settings-side-menu',
  templateUrl: './settings-side-menu.component.html',
})

export class SettingsSideMenuComponent {
  @Input() chapter: Section | null = null;
  @Input() section: Section | null = null;
  @Input() type: typeof SelectedSection.prototype.type = 'main';

}
