import {Component, Input, OnChanges, OnInit, SimpleChanges} from "@angular/core";
import {Survey, SurveyAnswer} from "../../../app/domain/survey";
import {zip} from "rxjs/internal/observable/zip";
import {FormControlService} from "../../services/form-control.service";
import {FormArray, FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {SurveyService} from "../../../app/services/survey.service";
import {ActivatedRoute, Route, Router} from "@angular/router";
import {
  Section,
  Field,
  GroupedFields,
  Model,
  Tabs,
  UiVocabulary
} from "../../domain/dynamic-form-model";
import BitSet from "bitset";

import UIkit from "uikit";

@Component({
  selector: 'app-survey',
  templateUrl: 'survey.component.html',
  providers: [FormControlService]
})

export class SurveyComponent implements OnInit, OnChanges {

  @Input() surveyAnswers: SurveyAnswer = null;
  @Input() survey: Survey = null;
  @Input() tabsHeader : string = null;

  surveyModel: Model;
  chapters: Section[] = [];
  chapterChangeMap: Map<string,boolean> = new Map<string, boolean>();
  currentChapter: Section = null;
  chapterForSubmission: Section = null;
  sortedSurveyAnswers: Object = {};
  vocabularies: Map<string, string[]>;
  subVocabularies: UiVocabulary[] = [];
  editMode = false;
  bitset: Tabs = new Tabs;

  ready = false;
  readonly : boolean = false;
  validate : boolean = false;
  errorMessage = '';
  successMessage = '';

  form: FormGroup;

  constructor(private formControlService: FormControlService, private fb: FormBuilder,
              private router: Router, private surveyService: SurveyService,
              private route: ActivatedRoute) {
    this.form = this.fb.group({});
  }

  ngOnInit() {
    if (this.router.url.includes('/view')) {
      this.readonly = true;
    } else if (this.router.url.includes('/validate')) {
      this.validate = true;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    this.ready = false;
    if (this.surveyAnswers) {
      this.editMode = true;

      zip(
        this.formControlService.getUiVocabularies(),
        this.formControlService.getFormModel(this.surveyAnswers.modelId)
      ).subscribe(res => {
          this.vocabularies = res[0];
          res[1].sections.sort((a, b) => a.order - b.order);
          this.surveyModel = res[1];
          this.chapters = [];
          for (const model of this.surveyModel.sections) {
            for (const surveyAnswer in this.surveyAnswers.chapterAnswers) {
              if (model.id === this.surveyAnswers.chapterAnswers[surveyAnswer].chapterId) {
                this.chapters.push(model);
                this.chapterChangeMap.set(model.id, false);
                this.sortedSurveyAnswers[model.id] = this.surveyAnswers.chapterAnswers[surveyAnswer].answer;
                break;
              }
            }
          }
          this.currentChapter = this.surveyModel.sections[0];
        },
        error => {
          this.errorMessage = 'Something went bad while getting the data for page initialization. ' + JSON.stringify(error.error.error);
        },
        () => {
          for (let i = 0; i < this.surveyModel.sections.length; i++) {
            this.form.addControl(this.surveyModel.sections[i].name, this.formControlService.toFormGroup(this.surveyModel.sections[i].subSections, true));
            this.prepareForm(this.sortedSurveyAnswers[Object.keys(this.sortedSurveyAnswers)[i]], this.surveyModel.sections[i].subSections)
            this.form.get(this.surveyModel.sections[i].name).patchValue(this.sortedSurveyAnswers[Object.keys(this.sortedSurveyAnswers)[i]]);
          }
          if (this.surveyAnswers.validated) {
            this.readonly = true;
            this.validate = false;
          } else if (this.validate) {
            UIkit.modal('#validation-modal').show();
          }

          setTimeout(() => {
            if (this.readonly) {
              this.form.disable();
            }
          }, 0);
          this.ready = true;
        });
    }
    else { // TODO: remove later
      this.route.params.subscribe(
        params => {
          zip(
            this.formControlService.getUiVocabularies(),
            this.formControlService.getFormModel(params['datasetTypeId'])
          ).subscribe(
            res => {
              this.vocabularies = res[0];
              this.surveyModel = res[1]
            },
            error => {console.log(error)},
            () => {
              for (let i = 0; i < this.surveyModel.sections.length; i++) {
                if (this.surveyModel.sections[i].subSections)
                  this.form.addControl(this.surveyModel.sections[i].name, this.formControlService.toFormGroup(this.surveyModel.sections[i].subSections, true));
                else {
                  this.form.addControl(this.surveyModel.name, this.formControlService.toFormGroup(this.surveyModel.sections, true));
                }
                // this.prepareForm(this.sortedSurveyAnswers[Object.keys(this.sortedSurveyAnswers)[i]], this.surveyModel.sections[i].subSections)
                // this.form.get(this.surveyModel.sections[i].name).patchValue(this.sortedSurveyAnswers[Object.keys(this.sortedSurveyAnswers)[i]]);
              }
              // if (this.surveyAnswers.validated) {
              //   this.readonly = true;
              //   this.validate = false;
              // } else if (this.validate) {
              //   UIkit.modal('#validation-modal').show();
              // }

              // setTimeout(() => {
              //   if (this.readonly) {
              //     this.form.disable();
              //   }
              // }, 0);
              this.ready = true
            }
          );
        }
      );
    }
  }

  validateSurvey() {
    for (const chapterChangeMapElement of this.chapterChangeMap) {
      if (chapterChangeMapElement[1]) {
        UIkit.modal('#validation-modal').hide();
        this.errorMessage = 'There are unsaved changes, please submit all changes first and then validate.';
        return;
      }
    }
    if (this.form.valid) {
      this.surveyService.changeAnswerValidStatus(this.surveyAnswers.id, !this.surveyAnswers.validated).subscribe(
        next => {
          UIkit.modal('#validation-modal').hide();
          this.router.navigate(['/contributions/mySurveys']);
        },
        error => {
          console.error(error);
        },
        () => {});
    } else {
      UIkit.modal('#validation-modal').hide();
      console.log('Invalid form');
      this.form.markAllAsTouched();
      let str = '';
      for (let key in this.form.value) {
        // console.log(this.form.get('extras.'+key));
        console.log(key + ': '+ this.form.get(key).valid);
        if (!this.form.get(key).valid) {
          str =  str + '\n\t-> ' + key;
        }
        for (const keyElement in this.form.get(key).value) {
          console.log(keyElement + ': '+ this.form.get(key+'.'+keyElement).valid);
        }
      }
      this.errorMessage = 'There are missing fields at chapters ' + str;
    }
  }

  onSubmit() {
    window.scrollTo(0, 0);
    // this.showLoader = true;
    this.formControlService.postItem(this.surveyAnswers.id, this.form.get(this.chapterForSubmission.name).value, this.editMode).subscribe(
      res => {
        this.successMessage = 'Updated successfully!';
        this.chapterChangeMap.set(this.chapterForSubmission.id, false);
        UIkit.modal('#unsaved-changes-modal').hide();
      },
      error => {
        this.errorMessage = 'Something went bad, server responded: ' + JSON.stringify(error?.error?.error);
        // this.showLoader = false;
        UIkit.modal('#unsaved-changes-modal').hide();
        console.log(error);
      },
      () => {
        setTimeout(() => {
          UIkit.alert('#successMessage').close();
        }, 4000);
        // this.showLoader = false;
      }
    );
  }

  showUnsavedChangesPrompt(chapter: Section) {
    if (this.chapterChangeMap.get(this.currentChapter.id)) {
      this.chapterForSubmission = this.currentChapter;
      UIkit.modal('#unsaved-changes-modal').show();
    }
    this.currentChapter = chapter;
  }

  getFormGroup(index?: number): FormGroup {
    if (this.surveyModel.sections[0].subSections === null) {
      return this.form.get(this.surveyModel.name) as FormGroup;
    } else
      return this.form.get(this.surveyModel.sections[index].name) as FormGroup;
  }

  setChapterChangesMap(chapterId: string[]) {
    if (chapterId[1] === null) {
      this.chapterChangeMap.set(chapterId[0], true);
    } else {
      this.chapterChangeMap.set(chapterId[0], false);
    }
  }

  /** create additional fields for arrays if needed --> **/
  prepareForm(form: Object, fields: Section[]) {
    console.log(form);
    for (const [key, value] of Object.entries(form)) {
      console.log(`${key}: ${value}`);
      if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
        console.log(key + ' is object');
        this.prepareForm(value, fields);
      } else if (Array.isArray(value)) {
        console.log(key + ' is array');
        let i = 1;
        for ( ;i < key.length; i++) {
          console.log('pushing to array ' + key);
          // this.push()
          if (typeof value[i] === 'object' && !Array.isArray(value[i]) && value !== null) {
            this.prepareForm(value[i], fields);
          }
        }
      } else if (value === null) {
        console.log(key+ ' is null');
      }
    }
    // for (let key in form) {
    //   console.log('key: '+key);
    //   for (let formElementKey in form[key]) {
    //     if(form[key].hasOwnProperty(formElementKey)) {
    //       console.log('formElementKey: '+formElementKey);
    //       if(Array.isArray(form[key][formElementKey])) {
    //         // console.log(form[key][formElementKey]);
    //         // console.log(formElementKey);
    //         let formFieldData = this.getModelData(fields, formElementKey);
    //         let i = 1;
    //         // if (formFieldData.typeInfo.type === 'composite') { // In order for the fields to be enabled
    //         //   this.popComposite(key, formElementKey)  // remove it first
    //         //   i = 0;  // increase the loops
    //         // }
    //         let count = 0;
    //         // for (i; i < form[key][formElementKey].length; i++) {
    //         //   if (formFieldData.typeInfo.type === 'composite') {
    //         //     this.pushComposite(key, formElementKey, formFieldData.subFields);
    //         //     // for (let formSubElementKey in form[key][formElementKey]) { // Special case when composite contains array
    //         //     for (let formSubElementName in form[key][formElementKey][count]) {
    //         //       if(form[key][formElementKey][count].hasOwnProperty(formSubElementName)) {
    //         //         if(Array.isArray(form[key][formElementKey][count][formSubElementName])) {
    //         //           // console.log('Key: ' + key + ' formElementKey: ' + formElementKey + ' count: ' + count + ' formSubElementName: ' + formSubElementName);
    //         //           const control = <FormArray>this.form.get([key,formElementKey,count,formSubElementName]);
    //         //           // console.log(control);
    //         //           let required = false;
    //         //           for (let j = 0; j < formFieldData.subFields.length; j++) {
    //         //             if (formFieldData.subFields[j].name === formSubElementName) {
    //         //               required = formFieldData.subFields[j].form.mandatory;
    //         //             }
    //         //           }
    //         //           for (let j = 0; j < form[key][formElementKey][count][formSubElementName].length - 1; j++) {
    //         //             control.push(required ? new FormControl('', Validators.required) : new FormControl(''));
    //         //           }
    //         //         }
    //         //       }
    //         //     }
    //         //     // }
    //         //     count++;
    //         //   } else {
    //         //     this.push(key, formElementKey, formFieldData.form.mandatory);
    //         //   }
    //         // }
    //       }
    //     }
    //   }
    // }
  }

  getModelData(model: GroupedFields[], name: string): Field {
    for (let i = 0; i < model.length; i++) {
      for (let j = 0; j < model[i].fields.length; j++) {
        if(model[i].fields[j].name === name) {
          return model[i].fields[j];
        } else if (model[i].fields[j].subFields.length > 0) {
          for (let k = 0; k < model[i].fields[j].subFields.length; k++) {
            if (model[i].fields[j].subFields[k].name === name) {
              return model[i].fields[j].subFields[k];
            }
          }
        }
      }
    }
    return null;
  }

  popComposite(group: string, field: string) {
    // console.log(this.form.value);
    // console.log(group)
    // console.log(this.form.get(group));
    // console.log(field)
    let tmpArr = this.form.get(group).get(field) as FormArray;
    tmpArr.removeAt(0);
  }

  push(group: string, field: string, required: boolean) {
    let tmpArr = this.form.get(group).get(field) as FormArray;
    tmpArr.push(required ? new FormControl('', Validators.required) : new FormControl(''));
  }

  pushComposite(group: string, field: string, subFields: Field[]) {
    const formGroup: any = {};
    subFields.forEach(subField => {
      if (subField.typeInfo.multiplicity) {
        formGroup[subField.name] = subField.form.mandatory ?
          new FormArray([new FormControl('', Validators.required)])
          : new FormArray([new FormControl('')]);
      } else {
        formGroup[subField.name] = subField.form.mandatory ? new FormControl('', Validators.required)
          : new FormControl('');
      }
    });
    let tmpArr = this.form.get(group).get(field) as FormArray;
    tmpArr.push(new FormGroup(formGroup));
  }
  /** <-- create additional fields for arrays if needed **/

  /** other stuff --> **/
  closeAlert() {
    this.errorMessage = '';
    UIkit.alert('#errorAlert').close();
  }
}
