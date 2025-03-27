import { AfterViewInit, Component } from "@angular/core";
import { Field, Model, Section } from "../../domain/dynamic-form-model";
import { FormGroup } from "@angular/forms";
import { FormControlService } from "../../services/form-control.service";
import { WebsocketService } from "../../../app/services/websocket.service";
import { cloneDeep } from 'lodash';
import UIkit from 'uikit';

export class SelectedSection {
  chapter: Section | null = null;
  section: Section | null = null;
  field: Field | null = null;
  sideMenuSettingsType: 'main' | 'chapter' | 'section' | 'field' | 'fieldSelector' = 'main';
}

@Component({
  selector: 'app-form-builder',
  templateUrl: 'form-builder.component.html',
  providers: [FormControlService, WebsocketService]
})

export class FormBuilderComponent implements AfterViewInit {

  model: Model = new Model();
  chapter: Section | null = null;
  section: Section | null = null;
  currentField: Field | null = null;
  sideMenuSettingsType: typeof SelectedSection.prototype.sideMenuSettingsType = 'main';

  mockForm: FormGroup = new FormGroup({});

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

  fieldSelection(field: Field): void {
    this.currentField = field;
    this.sideMenuSettingsType = 'field'
  }

  deleteField(position: number): void {
    this.section.fields.splice(position, 1);
    this.sideMenuSettingsType = 'section';
  }

  duplicateField(field: Field): void {
    this.section.fields.push(cloneDeep(field));
    // this.currentField = this.section.fields[this.section.fields.length - 1];
  }
}
