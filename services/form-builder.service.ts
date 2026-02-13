import { inject, Injectable, signal } from "@angular/core";
import { Field, FieldType, Model, Section, SelectedSection } from "../domain/dynamic-form-model";
import { IdGenerationService } from "./id-generation.service";
import { cloneDeep } from "lodash";
import { findMaxId } from "../shared/utils/utils";

@Injectable({providedIn: 'root'})

export class FormBuilderService {
  private idService = inject(IdGenerationService);

  // state
  private _model = signal<Model>(null);
  private _currentSection = signal<Section | null>(null);
  private _currentSubsection = signal<Section | null>(null);
  private _currentField = signal<Field | null>(null);
  private _sideMenuSettingsType = signal<typeof SelectedSection.prototype.sideMenuSettingsType>('main');

  // expose as readonly where appropriate
  readonly model = this._model.asReadonly();
  readonly currentSection = this._currentSection.asReadonly();
  readonly currentSubsection = this._currentSubsection.asReadonly();
  readonly currentField = this._currentField.asReadonly();
  readonly sideMenuSettingsType = this._sideMenuSettingsType.asReadonly();

  // Model options
  setModel(model?: Model) {
    this._model.set(model ?? new Model());
    if (!model) {
      this.addSection();
    }
    this.setCurrentSelection({chapter: null, section: null, field: null, sideMenuSettingsType: 'main'});
    this.idService.findMaxId(this.model());
  }

  setModelId(id: string) {
    this._model.update(model => {
      model.id = id;
      return model;
    });
  }

  setModelTitle(title: string) {
    this._model.update(model => {
      model.name = title;
      return model;
    });
  }

  setModelDescription(description: string) {
    this._model.update(model => {
      model.description = description;
      return model;
    });
  }

  setModelNotice(notice: string) {
    this._model.update(model => {
      model.notice = notice;
      return model;
    });
  }

  setModelLocked(locked: boolean) {
    this._model.update(model => {
      model.locked = locked;
      return model;
    });
  }

  setModelActive(active: boolean) {
    this._model.update(model => {
      model.active = active;
      return model;
    });
  }

  // Set signals on user actions
  setCurrentSelection(selection: SelectedSection) {
    this._currentSection.set(selection.chapter);
    this._currentSubsection.set(selection.section);
    this._currentField.set(selection.field);
    this._sideMenuSettingsType.set(selection.sideMenuSettingsType);
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

  setCurrentSubsection(section: Section) {
    this._currentSubsection.set(section);
  }

  setCurrentField(field: Field) {
    this._currentField.set(field);
  }

  // Section relevant action
  setSectionName(name: string) {
    this._currentSection.update(section => {
      section.name = name;
      return section;
    });
  }

  setSectionDescription(description: string) {
    this._currentSection.update(section => {
      section.description = description;
      return section;
    });
  }

  addSection() {
    const newChapter = new Section(this.idService.generateId().toString(),);
    this._model.update(model => {
      model.sections.push(newChapter);
      return model;
    });

    this.setCurrentSelection({chapter: newChapter, section: null, field: null, sideMenuSettingsType: 'chapter'});
  }

  deleteSection(index: number) {
    this._model.update(model => {
      model.sections.splice(index, 1);
      return model;
    });

    if (this._model().sections[index]) {
      this.setCurrentSelection({chapter: this._model().sections[index], section: null, field: null, sideMenuSettingsType: 'chapter'});
      return;
    } else if (this._model().sections[index-1]) {
      this.setCurrentSelection({chapter: this._model().sections[index-1], section: null, field: null, sideMenuSettingsType: 'chapter'});
      return;
    }
    this.setCurrentSelection({chapter: null, section: null, field: null, sideMenuSettingsType: 'main'});
  }

  // Subsection relevant actions
  setSubSectionName(name: string) {
    this._currentSubsection.update(subsection => {
      subsection.name = name;
      return subsection;
    });
  }

  setSubSectionDescription(description: string) {
    this._currentSubsection.update(subsection => {
      subsection.description = description;
      return subsection;
    });
  }

  addSubSection(index: number) {
    const newSection = new Section(this.idService.generateId().toString());
    this._model.update(model => {
      if (model.sections[index].subSections === null)
        model.sections[index].subSections = [];

      model.sections[index].subSections.push(newSection);
      return model;
    });
    this.setCurrentSubsection(newSection);
    this.setSideMenuSettingsType('section');
  }

  deleteSubSection(position: number, index: number) {
    this._model.update(model => {
      model.sections[position].subSections.splice(index, 1);
      return model;
    });

    if (this._model().sections[position].subSections[index]) {
      this.setCurrentSelection({
        chapter: this._model().sections[position],
        section: this._model().sections[position].subSections[index],
        field: null,
        sideMenuSettingsType: 'section'
      });
      return;
    } else if (this._model().sections[position].subSections[index-1]) {
      this.setCurrentSelection({
        chapter: this._model().sections[position],
        section: this._model().sections[position].subSections[index-1],
        field: null,
        sideMenuSettingsType: 'section'
      });
      return;
    }
    this.setCurrentSelection({chapter: this._model().sections[position], section: null, field: null, sideMenuSettingsType: 'chapter'});

  }

  // Field relevant actions
  setFieldType(type: FieldType) {
    this._currentField.update(field => {
      field.typeInfo.type = type;
      return field;
    });
  }

  setFieldPlaceholder(placeholder: string) {
    this._currentField.update(field => {
      field.form.placeholder = placeholder;
      return field;
    });
  }

  setFieldLabel(text: string) {
    this._currentField.update(field => {
      field.label.text = text;
      return field;
    });
  }

  addField(type: FieldType) {
    let tmpField: Field = new Field(this.idService.generateId().toString(), type);

    this._currentSubsection.update( section => {
      if (section.fields === null)
        section.fields = [];

      section.fields.push(tmpField);

      return section;
    });
    // if (tmpField.typeInfo.type !== 'composite')
      this.setCurrentField(tmpField);

    this.setSideMenuSettingsType('field');
  }

  deleteField(index: number, parentField?: Field) {
    if (parentField) {
      if (parentField.subFields) {
        parentField.subFields.splice(index, 1);
        // this.updateReference();
      }
      return;
    }
    this._currentSubsection.update(sec => {
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
      // this.updateReference();
      return;
    }
    this._currentSubsection.update(sec => {
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
        // this.updateReference();
      }
      return;
    }
    this._currentSubsection.update(sec => {
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
    this._currentSubsection.update(sec => {
      if (sec?.fields) {
        for (let i = 0; i < sec.fields.length; i++) {
          sec.fields[i] = {...sec.fields[i]};
        }
      }
      return sec;
    });
  }

}
