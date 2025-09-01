import { AfterViewInit, Component } from "@angular/core";
import { Field, Model, Section } from "../../domain/dynamic-form-model";
import { FormGroup } from "@angular/forms";
import { FormControlService } from "../../services/form-control.service";
import { WebsocketService } from "../../../app/services/websocket.service";
import { cloneDeep } from 'lodash';
import * as UIkit from 'uikit';
import { IdGenerationService } from "../../services/id-generation.service";

export class SelectedSection {
  chapter: Section | null = null;
  section: Section | null = null;
  field: Field | null = null;
  sideMenuSettingsType: 'main' | 'chapter' | 'section' | 'field' | 'fieldSelector' = 'main';
}

@Component({
    selector: 'app-form-builder',
    templateUrl: 'form-builder.component.html',
    styleUrls: ['form-builder.component.scss'],
    providers: [FormControlService, WebsocketService],
    standalone: false
})

export class FormBuilderComponent implements AfterViewInit {

  model: Model = new Model();
  chapter: Section | null = null;
  currentSection: Section | null = null;
  currentField: Field | null = null;
  sideMenuSettingsType: typeof SelectedSection.prototype.sideMenuSettingsType = 'main';

  constructor(private idService: IdGenerationService) {}

  ngAfterViewInit() {
    UIkit.modal('#fb-modal-full').show();
    this.idService.findMaxId(this.model);
  }

  setCurrentSection(selection: SelectedSection) {
    this.chapter = this.currentSection = this.currentField = null;

    this.chapter = selection.chapter;
    if (selection.section) {
      this.currentSection = selection.section;
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

  /** Field manipulation **/
  deleteField(position: number): void {
    this.currentSection.fields.splice(position, 1);
    this.sideMenuSettingsType = 'section';
  }

  duplicateField(field: Field): void {
    this.currentSection.fields.push(cloneDeep(field));
    // this.currentField = this.section.fields[this.section.fields.length - 1];
  }

  move(from: number, to: number): void {
    console.log('from: %d - to: %d',from, to);
    if (from >= this.currentSection.fields.length || to >= this.currentSection.fields.length || from < 0 || to < 0) {
      console.error('Invalid move position');
      return;
    }
    this.currentSection.fields.splice(to, 0, this.currentSection.fields.splice(from, 1)[0]);

    console.log(this.currentSection.fields);
  }

  /** Other **/
  updateReference(): void {
    for (let i = 0; i < this.currentSection.fields.length; i++) {
      this.currentSection.fields[i] = {...this.currentSection.fields[i]};
    }
    // this.section.fields
    console.log(this.currentSection);
  }
}
