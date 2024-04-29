import {
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges
} from "@angular/core";
import { AbstractControl, FormArray, FormGroup, UntypedFormArray, UntypedFormBuilder, UntypedFormGroup } from "@angular/forms";
import { Router } from "@angular/router";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Section, Field, Model, Tabs } from "../../domain/dynamic-form-model"
import { FormControlService } from "../../services/form-control.service";
import { PdfGenerateService } from "../../services/pdf-generate.service";
import { WebsocketService } from "../../../app/services/websocket.service";
import { UserActivity } from "../../../app/domain/userInfo";
import UIkit from "uikit";
import BitSet from "bitset";

declare var require: any;
const seedRandom = require('seedrandom');

@Component({
  selector: 'app-survey',
  templateUrl: 'survey.component.html',
  providers: [FormControlService, PdfGenerateService]
})

export class SurveyComponent implements OnInit, OnChanges, OnDestroy {

  protected destroyRef = inject(DestroyRef);

  @Input() payload: any = null; // can't import specific project class in lib file
  @Input() model: Model = null;
  @Input() subType: string = null;
  @Input() activeUsers: UserActivity[] = null;
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
  timeoutId: number = null;

  editMode: boolean = false;
  readonly: boolean = false;
  freeView: boolean = false;
  validate: boolean = false;

  form: UntypedFormGroup;
  previousValue: any = {};
  changedField: string | null = null;

  constructor(private formControlService: FormControlService, private pdfService: PdfGenerateService,
              private fb: UntypedFormBuilder, private router: Router, private wsService: WebsocketService) {
    this.form = this.fb.group({});
  }

  ngOnInit() {

    this.wsService.msg.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(
      next => {
    //     this.removeClass(this.activeUsers);
        this.activeUsers = next;
    //     this.activeUsers?.forEach( user => {
    //       if(user.position) {
    //         let sheet = window.document.styleSheets[0];
    //
    //         let styleExists = false;
    //         for (let i = 0; i < sheet.cssRules.length; i++) {
    //           if(sheet.cssRules[i] instanceof CSSStyleRule) {
    //             if((sheet.cssRules[i] as CSSStyleRule).selectorText === `user-${user.sessionId}`) {
    //               styleExists = true;
    //               break;
    //             }
    //           }
    //         }
    //         if (!styleExists)
    //           sheet.insertRule(`.user-${user.sessionId} { border-color: ${this.getRandomDarkColor(user.sessionId)} !important}`, sheet.cssRules.length);
    //
    //         console.log(sheet);
    //         // const flipCard = document.getElementById(user.position);
    //         // const flipCardElement: HTMLElement = flipCard!;
    //         // flipCard.classList.toggle(`user-${user.sessionId}`);
    //       }
    //     });
    //     this.addClass(this.activeUsers);
    //
      }
    );
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.router.url.includes('/view')) {
      this.readonly = true;
    } else if (this.router.url.includes('/freeView')) {
      this.freeView = true;
    } else if (this.router.url.includes('/validate')) {
      this.validate = true;
    }

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

        if (this.readonly) { // Used timeout because otherwise inner form parts weren't disabled
          setTimeout(() => {
            this.form.disable();
            this.form.markAsUntouched();
          }, 2000);
        }
      }

      if (this.payload?.validated) {
        this.readonly = true;
        this.validate = false;
      } else if (this.validate) {
        UIkit.modal('#validation-modal').show();
      }
      this.ready = true;

      // this.form.valueChanges.pipe(
      //   takeUntilDestroyed(this.destroyRef),
      //   debounceTime(1000),
      //   distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))).subscribe(changes => {
      //   this.changedField = this.detectChanges(changes, this.previousValue, '');
      //   console.log(this.changedField);
      //   console.log(this.getControlValue(this.changedField));
      //   this.previousValue = {...changes};
      // });

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

  ngOnDestroy() {
    clearTimeout(this.timeoutId);
  }

  /** Mark field as active --> **/
  addClass(users: UserActivity[]) {
    users?.forEach( user => {
      if (!user.position)
        return;

      const htmlElement = document.getElementById(user.position);
      console.log(user);
      console.log(htmlElement);
      if (htmlElement)
        htmlElement.classList.add(`user-${user.sessionId}`)
    });
  }

  removeClass(users: UserActivity[]) {
    users?.forEach( user => {
      if (!user.position)
        return;

      const htmlElement = document.getElementById(user.position);
      if (htmlElement)
        htmlElement.classList.remove(`user-${user.sessionId}`);
    });
  }
  /** <-- Mark field as active **/

  /** Find changed field and get value --> **/
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
      const currentPath = `${path}.[${i}]`;

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

  getControlValue(path: string): any {
    const segments = path.split('.');
    let control: AbstractControl | null = this.form;
    for (const segment of segments) {
      if (control instanceof FormGroup) {
        control = control.get(segment);
      } else if (control instanceof FormArray) {
        const index = Number(segment.split('[')[1].split(']')[0]);
        control = control.at(index);
      } else {
        break;
      }
    }
    return control ? control.value : null;
  }
  /** <-- Find changed field and get value **/

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
        // console.log(value);
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
    // console.log(name)
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
    this.pdfService.generatePDF(this.model, this.payload?.answer, this.form);
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
    this.timeoutId = setTimeout(() => {
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
