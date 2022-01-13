import {Component, Input, OnChanges, OnInit, SimpleChanges} from "@angular/core";
import {SurveyAnswer} from "../../../app/domain/survey";
import {zip} from "rxjs/internal/observable/zip";
import {FormControlService} from "../../services/form-control.service";
import {FormArray, FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {Router} from "@angular/router";
import {
  Chapter,
  ChapterModel,
  Fields,
  GroupedField,
  SurveyModel,
  Tab,
  Tabs,
  UiVocabulary
} from "../../domain/dynamic-form-model";
import BitSet from "bitset";

@Component({
  selector: 'app-survey',
  templateUrl: 'survey.component.html',
  providers: [FormControlService]
})

export class SurveyComponent implements OnInit, OnChanges {

  @Input() surveyAnswers: SurveyAnswer[] = [];
  @Input() tabsHeader : string = null;

  surveyModel: SurveyModel;
  chapters: ChapterModel[] = [];
  sortedSurveyAnswers: SurveyAnswer[] = [];
  currentChapter: ChapterModel = null;
  fields: GroupedField[] = null;
  vocabularies: Map<string, string[]>;
  subVocabularies: UiVocabulary[] = [];
  editMode = false;
  bitset: Tabs = new Tabs;

  ready = false;
  readonly : boolean = false;
  errorMessage = '';

  form: FormGroup;

  constructor(private formControlService: FormControlService,
              private fb: FormBuilder,
              private router: Router) {
    this.form = this.fb.group({});
  }

  ngOnInit() {
    if (this.router.url.includes('/view')) {
      this.readonly = true;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.surveyAnswers) {
      this.editMode = true;
      this.ready = false;
      zip(
        this.formControlService.getUiVocabularies(),
        this.formControlService.getFormModel(this.surveyAnswers[0].surveyId)
      ).subscribe(res => {
          this.vocabularies = res[0];
          this.surveyModel = res[1];
          // this.fields = res[1][Object.keys(res[1])[0]];
          for (const model of res[1].chapterModels) {
            this.chapters.push(model);
          }
        },
        error => {
          this.errorMessage = 'Something went bad while getting the data for page initialization. ' + JSON.stringify(error.error.error);
        },
        () => {
          this.chapters.sort((a, b) => a.chapter.order - b.chapter.order);
          for (const chapter of this.chapters) {
            for (const surveyAnswer of this.surveyAnswers) {
              if (chapter.chapter.id === surveyAnswer.chapterId) {
                this.sortedSurveyAnswers.push(surveyAnswer);
                break;
              }
            }
          }
          for (let i  = 0; i < this.chapters.length; i++) {
            this.form.addControl(this.chapters[i].chapter.name, this.formControlService.toFormGroup(this.chapters[i].groupedFieldsList, true)) ;
          }
          setTimeout(() => {
            if (this.readonly) {
              this.form.disable();
            }
          }, 0);
          this.ready = true;
        });
    }
  }

  getFormGroup(index: number): FormGroup {
    return this.form.get(this.chapters[index].chapter.name) as FormGroup;
  }

  initializations() {
    /** Create form **/
    let tmpForm: any = {};
    // tmpForm['service'] = this.formControlService.toFormGroup(this.fields, true);
    // tmpForm['extras'] = this.formControlService.toFormGroup(this.fields, false);
    // this.form = this.fb.group(tmpForm);


    /** Initialize tab bitsets **/
    let requiredTabs = 0, requiredTotal = 0;
    let obj = new Map();
    this.fields.forEach(group => {
      let tab = new Tab();
      tab.requiredOnTab = tab.remainingOnTab = group.required.topLevel;
      tab.valid = false;
      tab.order = group.group.order;
      tab.bitSet = new BitSet;
      // obj[group.group.id] = tab;
      obj.set(group.group.id, tab);
      if (group.required.topLevel > 0) {
        requiredTabs++;
      }
      requiredTotal += group.required.total;
    });
    this.bitset.tabs = obj;
    this.bitset.completedTabs = 0;
    this.bitset.completedTabsBitSet = new BitSet;
    this.bitset.requiredTabs = requiredTabs;
    this.bitset.requiredTotal = requiredTotal;

    /** Initialize and sort vocabulary arrays **/
    // let voc: UiVocabulary[] = this.vocabularies['Subcategory'].concat(this.vocabularies['Scientific subdomain'].concat(this.vocabularies['Subusers']));
    // this.subVocabularies = this.groupByKey(voc, 'parentId');
    // for (const [key, value] of Object.entries(this.vocabularies)) {
    //   this.premiumSort.transform(this.vocabularies[key], ['English', 'Europe', 'Worldwide']);
    // }
  }

  prepareForm(form: Object) {
    for (let key in form) {
      for (let formElementKey in form[key]) {
        if(form[key].hasOwnProperty(formElementKey)) {
          if(Array.isArray(form[key][formElementKey])) {
            // console.log(form[key][formElementKey]);
            // console.log(formElementKey);
            let formFieldData = this.getModelData(this.fields, formElementKey);
            let i = 1;
            if (formFieldData.field.typeInfo.type === 'composite') { // In order for the fields to be enabled
              this.popComposite(key, formElementKey)  // remove it first
              i = 0;  // increase the loops
            }
            let count = 0;
            for (i; i < form[key][formElementKey].length; i++) {
              if (formFieldData.field.typeInfo.type === 'composite') {
                this.pushComposite(key, formElementKey, formFieldData.subFieldGroups);
                // for (let formSubElementKey in form[key][formElementKey]) { // Special case when composite contains array
                for (let formSubElementName in form[key][formElementKey][count]) {
                  if(form[key][formElementKey][count].hasOwnProperty(formSubElementName)) {
                    if(Array.isArray(form[key][formElementKey][count][formSubElementName])) {
                      // console.log('Key: ' + key + ' formElementKey: ' + formElementKey + ' count: ' + count + ' formSubElementName: ' + formSubElementName);
                      const control = <FormArray>this.form.get([key,formElementKey,count,formSubElementName]);
                      // console.log(control);
                      let required = false;
                      for (let j = 0; j < formFieldData.subFieldGroups.length; j++) {
                        if (formFieldData.subFieldGroups[j].field.name === formSubElementName) {
                          required = formFieldData.subFieldGroups[j].field.form.mandatory;
                        }
                      }
                      for (let j = 0; j < form[key][formElementKey][count][formSubElementName].length - 1; j++) {
                        control.push(required ? new FormControl('', Validators.required) : new FormControl(''));
                      }
                    }
                  }
                }
                // }
                count++;
              } else {
                this.push(key, formElementKey, formFieldData.field.form.mandatory);
              }
            }
          }
        }
      }
    }
  }

  push(group: string, field: string, required: boolean) {
    let tmpArr = this.form.get(group).get(field) as FormArray;
    tmpArr.push(required ? new FormControl('', Validators.required) : new FormControl(''));
  }

  pushComposite(group: string, field: string, subFields: Fields[]) {
    const formGroup: any = {};
    subFields.forEach(subField => {
      if (subField.field.typeInfo.multiplicity) {
        formGroup[subField.field.name] = subField.field.form.mandatory ?
          new FormArray([new FormControl('', Validators.required)])
          : new FormArray([new FormControl('')]);
      } else {
        formGroup[subField.field.name] = subField.field.form.mandatory ? new FormControl('', Validators.required)
          : new FormControl('');
      }
      // In this case fields must be enabled
      // if (subField.field.form.dependsOn !== null) {
      //   formGroup[subField.field.name].disable();
      // }
    });
    let tmpArr = this.form.get(group).get(field) as FormArray;
    tmpArr.push(new FormGroup(formGroup));
  }

  popComposite(group: string, field: string) {
    let tmpArr = this.form.get(group).get(field) as FormArray;
    tmpArr.removeAt(0);
  }

  getModelData(model: GroupedField[], name: string): Fields {
    for (let i = 0; i < model.length; i++) {
      for (let j = 0; j < model[i].fields.length; j++) {
        if(model[i].fields[j].field.name === name) {
          return model[i].fields[j];
        }
      }
    }
    return null;
  }

}
