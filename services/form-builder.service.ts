import { inject, Injectable, signal } from "@angular/core";
import { Field, FieldType, Model, Section, SelectedSection } from "../domain/dynamic-form-model";
import { IdGenerationService } from "./id-generation.service";
import { cloneDeep } from "lodash";

@Injectable({providedIn: 'root'})

export class FormBuilderService {
  private idService = inject(IdGenerationService);

  // state
  private _model = signal<Model>(new Model());
  private _chapter = signal<Section | null>(null);
  private _currentSection = signal<Section | null>(null);
  private _currentField = signal<Field | null>(null);
  private _sideMenuSettingsType = signal<typeof SelectedSection.prototype.sideMenuSettingsType>('main');

  // expose as readonly where appropriate
  readonly model = this._model.asReadonly();
  readonly chapter = this._chapter.asReadonly();
  readonly currentSection = this._currentSection.asReadonly();
  readonly currentField = this._currentField.asReadonly();
  readonly sideMenuSettingsType = this._sideMenuSettingsType.asReadonly();

  setCurrentSelection(sel: SelectedSection) {
    this._chapter.set(sel.chapter);
    this._currentSection.set(sel.section);
    this._currentField.set(sel.field);
    this._sideMenuSettingsType.set(sel.sideMenuSettingsType);
  }

  fieldSelection(field: Field) {
    this._currentField.set(field);
    this._sideMenuSettingsType.set('field');
  }

  setSideMenuSettingsType(type: typeof SelectedSection.prototype.sideMenuSettingsType) {
    this._sideMenuSettingsType.set(type);
  }

  setCurrentSection(section: Section) {
    this._currentSection.set(section);
  }

  setCurrentField(field: Field) {
    this._currentField.set(field);
  }

  addField(type: FieldType) {
    let tmpField: Field = new Field(this.idService.generateId().toString(), type);

    this._currentSection.update( section => {
      if (section.fields === null)
        section.fields = [];

      section.fields.push(tmpField);

      return section;
    });
    if (tmpField.typeInfo.type !== 'composite')
      this.setCurrentField(tmpField);

    this.setSideMenuSettingsType('field');
  }

  deleteField(index: number, parentField?: Field) {
    if (parentField) {
      if (parentField.subFields) {
        parentField.subFields.splice(index, 1);
        this.updateReference();
      }
      return;
    }
    this._currentSection.update(sec => {
      if (sec?.fields) {
        sec.fields.splice(index, 1);
      }
      return sec;
    });
    this._sideMenuSettingsType.set('section');
  }

  duplicateField(field: Field, parentField?: Field) {
    const newField = cloneDeep(field);
    newField.id = this.idService.generateId().toString();
    if (parentField) {
      if (!parentField.subFields) parentField.subFields = [];
      parentField.subFields.push(newField);
      this.updateReference();
      return;
    }
    this._currentSection.update(sec => {
      if (sec) {
        if (!sec.fields) sec.fields = [];
        sec.fields.push(newField);
      }
      return sec;
    });
  }

  move(from: number, to: number, parentField?: Field) {
    if (parentField) {
      if (parentField.subFields) {
        if (from >= parentField.subFields.length || to >= parentField.subFields.length || from < 0 || to < 0) {
          return;
        }
        parentField.subFields.splice(to, 0, parentField.subFields.splice(from, 1)[0]);
        this.updateReference();
      }
      return;
    }
    this._currentSection.update(sec => {
      if (sec?.fields) {
        if (from >= sec.fields.length || to >= sec.fields.length || from < 0 || to < 0) {
          console.error('Invalid move position');
          return sec;
        }
        sec.fields.splice(to, 0, sec.fields.splice(from, 1)[0]);
      }
      return sec;
    });
  }

  addCompositeField(parent?: Field) {
    if (parent) {
      this.setCurrentField(parent);
      this.addFieldToComposite(FieldType.composite);
      return;
    }
    this.addField(FieldType.composite);
  }

  addFieldToComposite(type: FieldType) {
    let tmpField: Field = new Field(this.idService.generateId().toString(), type);

    this._currentField.update( field => {
      if (field.subFields === null)
        field.subFields = [];

      field.subFields.push(tmpField);
      return field;
    });
    this.setCurrentField(tmpField);
    this.setSideMenuSettingsType('field');
  }


  // Ckeditor specific update
  updateReference(): void {
    this._currentSection.update(sec => {
      if (sec?.fields) {
        for (let i = 0; i < sec.fields.length; i++) {
          sec.fields[i] = {...sec.fields[i]};
        }
      }
      return sec;
    });
  }

}
