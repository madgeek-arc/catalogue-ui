import {
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges
} from "@angular/core";
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup } from "@angular/forms";
import { Router } from "@angular/router";
import { FormControlService } from "../../services/form-control.service";
import { Section, Field, Model, Tabs } from "../../domain/dynamic-form-model";
import {
  Columns,
  Content,
  DocDefinition,
  PdfImage,
  PdfMetadata,
  PdfTable,
  TableDefinition
} from "../../domain/PDFclasses";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import BitSet from "bitset";

import UIkit from "uikit";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { debounceTime, distinctUntilChanged } from "rxjs/operators";
pdfMake.vfs = pdfFonts.pdfMake.vfs;
declare var require: any;
const seedRandom = require('seedrandom');

@Component({
  selector: 'app-survey',
  templateUrl: 'survey.component.html',
  providers: [FormControlService]
})

export class SurveyComponent implements OnInit, OnChanges {

  protected destroyRef = inject(DestroyRef);

  @Input() payload: any = null; // can't import specific project class in lib file
  @Input() model: Model = null;
  @Input() subType: string = null;
  @Input() activeUsers: any[] = null;
  @Input() vocabulariesMap: Map<string, object[]> = null;
  @Input() subVocabularies: Map<string, object[]> = null;
  @Input() tabsHeader: string = null;
  @Input() mandatoryFieldsText: string = null;
  @Input() downloadPDF: boolean = false;
  @Input() errorMessage = '';
  @Input() successMessage = '';
  @Output() valid = new EventEmitter<boolean>();
  @Output() submit = new EventEmitter<[UntypedFormGroup, boolean, string?]>();

  sectionIndex = 0;
  chapterChangeMap: Map<string,boolean> = new Map<string, boolean>();
  currentChapter: Section = null;
  chapterForSubmission: Section = null;
  sortedSurveyAnswers: Object = {};
  bitset: Tabs = new Tabs;
  ready: boolean = false;

  editMode: boolean = false;
  readonly: boolean = false;
  freeView: boolean = false;
  validate: boolean = false;

  form: UntypedFormGroup;
  previousValue: any = {};
  changedField: string | null = null;

  constructor(private formControlService: FormControlService, private fb: UntypedFormBuilder, private router: Router) {
    this.form = this.fb.group({});
  }

  ngOnInit() {
    if (this.router.url.includes('/view')) {
      this.readonly = true;
    } else if (this.router.url.includes('/freeView')) {
      this.freeView = true;
    } else if (this.router.url.includes('/validate')) {
      this.validate = true;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.payload)
      this.editMode = true;

    if (changes.model) {
      this.ready = false;

      this.currentChapter = this.model.sections[0];
      this.model.sections = this.model.sections.sort((a, b) => a.order - b.order);
      for (const section of this.model.sections) {
        for (const surveyAnswer in this.payload?.answer) {
          if (section.id === this.payload.answer[surveyAnswer]?.chapterId) {
            this.chapterChangeMap.set(section.id, false);
            this.sortedSurveyAnswers[section.id] = this.payload.answer[surveyAnswer].answer;
            break;
          }
        }
      }
      for (let i = 0; i < this.model.sections.length; i++) {
        if (this.model.sections[i].subSections === null) {
          this.form.addControl(this.model.name, this.formControlService.toFormGroup(this.model.sections, true));
          break;
        }
        if (!this.model.sections[i].subType || this.model.sections[i].subType === this.subType) {
          this.form.addControl(this.model.sections[i].name, this.formControlService.toFormGroup(this.model.sections[i].subSections, true));
        }
      }

      // Patch form
      if (this.payload?.answer) {
        for (let i = 0; i < this.model.sections.length; i++) {
          if (this.payload.answer[this.model.sections[i].name])
            this.prepareForm(this.payload.answer[this.model.sections[i].name], this.model.sections[i].subSections);
        }
        this.form.patchValue(this.payload.answer);
        this.form.markAllAsTouched();
      }

      if (this.payload?.validated) {
        this.readonly = true;
        this.validate = false;
      } else if (this.validate) {
        UIkit.modal('#validation-modal').show();
      }
      if (this.readonly) {
        this.form.disable();
        this.form.markAsUntouched();
      }
      this.ready = true;

      this.form.valueChanges.pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(1000),
        distinctUntilChanged()).subscribe(changes => {
        this.changedField = this.detectChanges(changes, this.previousValue, '');
        console.log(this.changedField);
        this.previousValue = { ...changes };
      });

    }

    if (this.activeUsers?.length > 0) {
      setTimeout(()=> {
        let users = [];
        this.activeUsers.forEach(user => {
          users.push(' '+user.fullname);
        });
        UIkit.tooltip('#concurrentEdit', {title: users.toString(), pos: 'bottom'});
      }, 0);
    }
  }

  detectChanges(currentValue: any, previousValue: any, path: string): string | null {
    for (const field of Object.keys(currentValue)) {
      const currentPath = path ? `${path}.${field}` : field;

      if (Array.isArray(currentValue[field]) && Array.isArray(previousValue[field])) {
        const nestedChanges = this.detectArrayChanges(currentValue[field], previousValue[field], currentPath);
        if (nestedChanges !== null) {
          return nestedChanges;
        }
      } else if (currentValue[field] instanceof Object && previousValue[field] instanceof Object) {
        const nestedChanges = this.detectChanges(currentValue[field], previousValue[field], currentPath);
        if (nestedChanges !== null) {
          return nestedChanges;
        }
      } else if (previousValue[field] !== currentValue[field]) {
        return currentPath;
      }
    }
    return null;
  }

  detectArrayChanges(currentArray: any[], previousArray: any[], path: string): string | null {
    for (let i = 0; i < Math.max(currentArray.length, previousArray.length); i++) {
      const currentPath = `${path}[${i}]`;

      if (currentArray[i] instanceof Object && previousArray[i] instanceof Object) {
        const nestedChanges = this.detectChanges(currentArray[i], previousArray[i], currentPath);
        if (nestedChanges !== null) {
          return nestedChanges;
        }
      } else if (previousArray[i] !== currentArray[i]) {
        return currentPath;
      }
    }
    return null;
  }

  validateForm() {
    for (const chapterChangeMapElement of this.chapterChangeMap) {
      if (chapterChangeMapElement[1]) {
        UIkit.modal('#validation-modal').hide();
        this.errorMessage = 'There are unsaved changes, please submit all changes first and then validate.';
        return;
      }
    }
    if (this.form.valid) {
      this.valid.emit(this.form.valid);
    } else {
      UIkit.modal('#validation-modal').hide();
      console.log('Invalid form');
      this.form.markAllAsTouched();
      let str = '';
      for (let key in this.form.value) {
        // console.log(this.form.get('extras.'+key));
        // console.log(key + ': '+ this.form.get(key).valid);
        if (!this.form.get(key).valid) {
          str =  str + '\n\t-> ' + key;
        }
        for (const keyElement in this.form.get(key).value) {
          // console.log(keyElement + ': '+ this.form.get(key+'.'+keyElement).valid);
        }
      }
      this.errorMessage = 'There are missing fields at chapters ' + str;
    }
  }

  parentSubmit() {
    this.submit.emit([this.form, this.editMode, this.model.resourceType]);
  }

  onSubmit() { // FIXME, or better yet remove me
    window.scrollTo(0, 0);
    // this.showLoader = true;
    // this.formControlService.postItem(this.surveyAnswers.id, this.form.get(this.chapterForSubmission.name).value, this.editMode).subscribe(
    let postMethod = '';
    let firstParam = '';
    if (this.payload?.id) {
      postMethod = 'postItem';
      firstParam = this.payload.id;
    } else {
      postMethod = 'postGenericItem'
      firstParam = this.model.resourceType;
    }
    this.formControlService[postMethod](firstParam, this.form.value, this.editMode).subscribe(
      res => {
        this.successMessage = 'Updated successfully!';
        for (const key of this.chapterChangeMap.keys()) {
          this.chapterChangeMap.set(key, false);
        }
        UIkit.modal('#unsaved-changes-modal').hide();
        this.payload = res;
      },
      error => {
        this.errorMessage = 'Something went bad, server responded: ' + JSON.stringify(error?.error?.message);
        UIkit.modal('#unsaved-changes-modal').hide();
        // this.showLoader = false;
        // console.log(error);
      },
      () => {
        this.closeSuccessAlert();
        // this.showLoader = false;
      }
    );
  }

  showUnsavedChangesPrompt(chapter: Section) {
    if (this.readonly || this.freeView)
      return;
    if (this.chapterChangeMap.get(this.currentChapter.id)) {
      this.chapterForSubmission = this.currentChapter;
      UIkit.modal('#unsaved-changes-modal').show();
    }
    this.currentChapter = chapter;
  }

  getFormGroup(sectionIndex: number): UntypedFormGroup {
    if (this.model.sections[sectionIndex].subSections === null) {
      return this.form.get(this.model.name) as UntypedFormGroup;
    } else
      // console.log(this.form.get(this.survey.sections[sectionIndex].name));
      return this.form.get(this.model.sections[sectionIndex].name) as UntypedFormGroup;
  }

  setChapterChangesMap(chapterId: string[]) {
    if (chapterId[1] === null) {
      this.chapterChangeMap.set(chapterId[0], true);
    } else {
      this.chapterChangeMap.set(chapterId[0], false);
    }
  }

  /** create additional fields for arrays if needed --> **/
  prepareForm(answer: Object, fields: Section[], arrayIndex?: number) { // I don't think it will work with greater depth than 2 of array nesting
    for (const [key, value] of Object.entries(answer)) {
      if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
        this.prepareForm(value, fields);
      } else if (Array.isArray(value)) {
        if (value?.length > 1) {
          this.pushToFormArray(key, value.length, arrayIndex);
        }
        for (let i = 0 ;i < value?.length; i++) {
          if (typeof value[i] === 'object' && !Array.isArray(value[i]) && value[i] !== null) {
            this.prepareForm(value[i], fields, i);
          }
          // Maybe a check for array in array should be here
        }
      } else if (value === null) {
        // console.log(key+ ' is null');
      }
    }
  }

  pushToFormArray(name: string, length: number, arrayIndex?: number) {
    let field = this.getModelData(this.model.sections, name);
    while (this.getFormControl(this.form, name, arrayIndex).length < length) {
      this.getFormControl(this.form, name, arrayIndex).push(this.formControlService.createField(field));
    }
  }

  getModelData(model: Section[], name: string): Field {
    let field = null;
    for (let i = 0; i < model.length; i++) {
      if (model[i].fields === null) {
        field = this.getModelData(model[i].subSections, name);
        if (field) {
          return field;
        }
      } else {
        field = this.searchSubFields(model[i].fields, name);
        if (field) {
          return field;
        }
      }
    }
    return field;
  }

  searchSubFields(fields: Field[], name): Field | null {
    let field = null;
    for (let j = 0; j < fields.length; j++) {
      if(fields[j].name === name) {
        return fields[j];
      } else if (fields[j].subFields?.length > 0) {
        field = this.searchSubFields(fields[j].subFields, name);
        if (field?.name === name)
          return field;
      }
    }
    return null;
  }

  getFormControl(group: UntypedFormGroup | UntypedFormArray, name: string, position?: number): UntypedFormArray {
    let abstractControl = null;
    for (const key in group.controls) {
      abstractControl = group.controls[key];
      if (abstractControl instanceof UntypedFormGroup || abstractControl instanceof UntypedFormArray) {
        if (key === name) {
          return abstractControl as UntypedFormArray;
        } else if (key !== name) {
          if (abstractControl instanceof UntypedFormArray) {
            if (abstractControl.controls.length > position) {
              abstractControl = this.getFormControl(abstractControl.controls[position] as UntypedFormGroup | UntypedFormArray, name, position);
              if (abstractControl !== null)
                return abstractControl;
            } else {
              abstractControl = null;
            }
          } else {
            abstractControl = this.getFormControl(abstractControl, name, position);
            if (abstractControl !== null)
              return abstractControl;
          }
        }
      } else {
        if (key === name) {
          return abstractControl;
        }
        abstractControl = null;
      }
    }
    return abstractControl;
  }
  /** <-- create additional fields for arrays if needed **/

  /** Generate PDF --> **/
  generatePDF() {
    let docDefinition: DocDefinition = new DocDefinition();
    docDefinition.content.push(new Content(this.model.name, ['title']));
    if (this.model.notice)
      docDefinition.content.push({text: this.strip(this.model.notice), italics: true, alignment: 'justify'});
    docDefinition.info = new PdfMetadata(this.model.name);

    let description = 'none';
    if (this.model.name === 'Survey on National Contributions to EOSC 2022' || this.model.id === 'm-eosc-sb-2023') {
      description = 'end'
    }
    this.createDocumentDefinition(this.form, docDefinition, description);

    pdfMake.createPdf(docDefinition).download(this.model.name);
  }

  documentDefinitionRecursion(fields: Field[], docDefinition: DocDefinition, description: string, descriptionAtEnd?: DocDefinition) {
    for (const field of fields) {
      if (field.deprecated)
        continue;
      if (field.label.text)
        docDefinition.content.push(new Content(field.label.text, ['mx_3']));
      if (field.form.description.text
        && !field.form.description.text.includes('Please add only new use cases as any use cases submitted in the previous survey will be imported here')
        && !field.form.description.text.includes('For example on curricula for data stewardship')
      ) {
        if (description === 'end') {
          let questionNumber = null;
          if (field.label.text) {
            questionNumber = field.label.text.split('. ')[0];
          }
          // let term = field.form.description.text.split('-')[0]
          // console.log(this.strip(field.form.description.text));

          if (this.model.id === 'm-eosc-sb-2023') {
            let strArray = [];
            if (this.strip(field.form.description.text).includes('Instructions')) {
              if (this.strip(field.form.description.text).includes('Glossary'))
                strArray[0] = this.string_between_strings('Instructions', 'Glossary', this.strip(field.form.description.text));
              else
                strArray[0] = this.strip(field.form.description.text).split('Instructions')[1];
              // console.log(this.strip(field.form.description.text));
            }
            if (field.form.description.text.split('Glossary').length > 1)
              strArray[1] = field.form.description.text.split('Glossary')[1];

            let content = {
              style: ['mt_3'],
              text: []
            }
            content.text.push({text: questionNumber+' '});
            let terms = strArray[1]?.split('<br><br>')
            if (terms?.length > 0) {
              for (let i = 0; i < terms.length; i++) {
                content.text.push({text:  this.strip(terms[i].split(':')[0])+': ', bold: true});
                content.text.push({text:  this.strip(terms[i].split(':')[1]).concat('\n')});
              }
            }
            content.text.push({text:  strArray[0] ? 'Instructions' : '', bold: true});
            content.text.push({text: strArray[0] ? ' - '+strArray[0] : ''});


            // descriptionAtEnd.content.push(new Content(questionNumber + ' ' + components.shift() + '-' + components.join('-'), ['mt_3']));
            if (strArray.length)
              descriptionAtEnd.content.push(content);

          } else {
            let components = this.strip(field.form.description.text).split(' - ');
            let content = {
              style: ['mt_3'],
              text: [
                questionNumber,
                ' ',
                {text:  components.shift(), bold: true},
                ' - ',
                components.join('-')
              ]
            }
            // descriptionAtEnd.content.push(new Content(questionNumber + ' ' + components.shift() + '-' + components.join('-'), ['mt_3']));
            descriptionAtEnd.content.push(content);
          }

        }
        if (description === 'show')
          docDefinition.content.push(new Content(field.form.description.text, ['mt_3']));
      }
      let answerValues = this.findVal(this.payload?.answer, field.name);
      if (field.typeInfo.type === 'radio') {
        let values = field.typeInfo.values
        // if (field.kind === 'conceal-reveal')
        //   values = this.getModelData(this.model.sections, field.parent).typeInfo.values;
        for (const value of values) {
          let content = new Columns();
          if (value === answerValues?.[0]){
            content.columns.push(new PdfImage('radioChecked', 10, 10, ['marginTopCheckBox']));
          }
          else {
            content.columns.push(new PdfImage('radioUnchecked', 10, 10, ['marginTopCheckBox']));
          }
          content.columns.push(new Content(value,['ms_1', 'mt_1']));
          docDefinition.content.push(content);
        }
      } else if (field.typeInfo.type === 'checkbox') {
        docDefinition.content.pop();
        let content = new Columns(['mx_1']);
        if (answerValues?.[0]) {
          content.columns.push(new PdfImage('checked', 10, 10, ['mt_1']));
        } else {
          content.columns.push(new PdfImage('unchecked', 10, 10, ['mt_1']));
        }
        content.columns.push(new Content(field.label.text,['ms_1']));
        docDefinition.content.push(content);
      } else if (field.typeInfo.type === 'largeText' || field.typeInfo.type === 'richText') {
        if (answerValues?.[0]) {
          docDefinition.content.push(new PdfTable(new TableDefinition([[this.strip(answerValues[0])]], ['*']), ['mt_1']));
        } else {
          docDefinition.content.push(new PdfTable(new TableDefinition([['']],['*'], [48]), ['mt_1']));
        }
      } else if (field.typeInfo.type !== 'composite') {
        if (answerValues?.[0]) {
          docDefinition.content.push(new PdfTable(new TableDefinition([[answerValues[0]]], ['*']), ['mt_1']));
        } else if (field.form.placeholder) {
          docDefinition.content.push(new PdfTable(new TableDefinition([[{text: field.form.placeholder, color: 'gray'}]],['*']), ['mt_1']));
        } else {
          docDefinition.content.push(new PdfTable(new TableDefinition([['']],['*'], [16]), ['mt_1']));
        }
      } else if (field.kind === 'external' && field.typeInfo.type === 'composite') {
        docDefinition.content.push(new PdfTable(new TableDefinition([[{text: field.form.description, color: 'gray'}]],['*']), ['mt_1']));
        continue;
      }
      if (field.subFields)
        this.documentDefinitionRecursion(field.subFields, docDefinition, description, descriptionAtEnd);
    }
  }

  createDocumentDefinition(group: UntypedFormGroup | UntypedFormArray, docDefinition: DocDefinition, description: string) {
    let descriptionsAtEnd = new DocDefinition();

    if (this.model.name === 'Survey on National Contributions to EOSC 2022'  || this.model.id === 'm-eosc-sb-2023') {
      docDefinition.content.push(new Content('Definitions of key terms can be found in Appendix A', ['mt_3']));
    }

    this.model.sections.sort((a, b) => a.order - b.order);
    for (const section of this.model.sections) {
      section.subSections.sort((a, b) => a.order - b.order);
      if (this.model.sections.length > 1) {
        docDefinition.content.push(new Content(section.name, ['chapterHeader']));
      }

      for (const subSection of section.subSections) {
        if (section.subSections.length > 1) {
          docDefinition.content.push(new Content(subSection.name, ['tabHeader']));
        }
        if (subSection.fields)
          this.documentDefinitionRecursion(subSection.fields, docDefinition, description, descriptionsAtEnd);
      }

    }

    if (this.model.name === 'Survey on National Contributions to EOSC 2022' || this.model.id === 'm-eosc-sb-2023') {

      docDefinition.content.push(new Content('Appendix A', ['title']));
      docDefinition.content.push(...descriptionsAtEnd.content);

      docDefinition.content.push(new Content('Appendix B', ['title']));
      let content = [
        {
          style: ['mt_3'],
          text: ['Visit the ',
            {text: 'EOSC Observatory', link: 'https://eoscobservatory.eosc-portal.eu', color: 'cornflowerblue', decoration: 'underline'},
            ' to explore the data from the EOSC Steering Board surveys on National Contributions to EOSC and visit the ',
            {text: 'EOSC Observatory Zenodo Community', link: 'https://zenodo.org/communities/eoscobservatory', color: 'cornflowerblue', decoration: 'underline'},
            ' to access all key outputs related to the surveys and EOSC Observatory.']
        }
      ]
      docDefinition.content.push(content);
    }

    return;

  }

  findVal(obj, key) {
    if (!obj)
      return null;
    let seen = new Set, active = [obj];
    while (active.length) {
      let new_active = [], found = [];
      for (let i=0; i<active.length; i++) {
        Object.keys(active[i]).forEach(function(k){
          let x = active[i][k];
          if (k === key) {
            found.push(x);
          } else if (x && typeof x === "object" &&
            !seen.has(x)) {
            seen.add(x);
            new_active.push(x);
          }
        });
      }
      if (found.length) return found;
      active = new_active;
    }
    return null;
  }

  strip(html){
    let doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
  }

  string_between_strings(startStr: string, endStr: any, str: string) {
    let pos = str.indexOf(startStr) + startStr.length;
    return str.substring(pos, str.indexOf(endStr, pos));
  }

  /** <-- Generate PDF **/

  /** other stuff --> **/
  closeError() {
    UIkit.alert('#errorAlert').close();
    setTimeout(() => {
      this.errorMessage = '';
    }, 550);
  }

  closeSuccessAlert() {
    setTimeout(() => {
      UIkit.alert('#successAlert').close();
    }, 4000);
    setTimeout(() => {
      this.successMessage = '';
    }, 4550);
  }

  getInitials(fullName: string) {
    return fullName.split(" ").map((n)=>n[0]).join("")
  }

  actionIcon(action: string) {
    switch (action) {
      case 'view':
        return 'visibility';
      case 'validate':
        return 'task_alt';
      case 'edit':
        return 'edit';
      default:
        return '';
    }
  }

  actionTooltip(action: string) {
    switch (action) {
      case 'view':
        return 'viewing';
      case 'validate':
        return 'validating';
      case 'edit':
        return 'editing';
      default:
        return '';
    }
  }

  getRandomDarkColor(sessionId: string) { // (use for background with white/light font color)
    const rng = seedRandom(sessionId);
    const h = Math.floor(rng() * 360),
      s = Math.floor(rng() * 100) + '%',
      // max value of l is 100, but set it to 55 in order to generate dark colors
      l = Math.floor(rng() * 55) + '%';

    return `hsl(${h},${s},${l})`;
  };

  toTop() {
    window.scrollTo(0,0);
  }

}
