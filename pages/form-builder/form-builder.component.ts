import { AfterViewInit, Component } from "@angular/core";
import { Field, Model, Section } from "../../domain/dynamic-form-model";
import UIkit from 'uikit';

export class SelectedSection {
  chapter: Section | null = null;
  section: Section | null = null;
  field: Field | null = null;
  sideMenuSettingsType: 'main' | 'chapter' | 'section' | 'field' | 'fieldSelector' = 'main';
}

@Component({
  selector: 'app-form-builder',
  templateUrl: 'form-builder.component.html'
})

export class FormBuilderComponent implements AfterViewInit {

  model: Model = new Model();
  chapter: Section | null = null;
  section: Section | null = null;
  currentField: Field | null = null;
  sideMenuSettingsType: typeof SelectedSection.prototype.sideMenuSettingsType = 'main';

  ngAfterViewInit() {
    UIkit.modal('#fb-modal-full').show();
  }

  setCurrentSection(selection: SelectedSection) {
    this.chapter = this.section = this.currentField = null;

    this.chapter = selection.chapter;
    if (selection.section) {
      this.section = selection.section;
    }
    if (selection.field) {
      this.currentField = selection.field;
    }

    this.sideMenuSettingsType = selection.sideMenuSettingsType;

  }
}
