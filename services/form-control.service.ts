import {Injectable, OnInit} from '@angular/core';
import {FormArray, FormControl, FormGroup, Validators} from '@angular/forms';
import {Fields, GroupedField, SurveyModel} from '../domain/dynamic-form-model';
import {environment} from '../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {urlRegEx} from "../shared/validators/generic.validator";

@Injectable()
export class FormControlService implements OnInit{
  constructor(public http: HttpClient) { }

  base = environment.API_ENDPOINT;
  private options = {withCredentials: true};
  urlRegEx = urlRegEx;
  numbersOfDecimals = '1';
  numberRegEx = `^(\\d)*(\\.)?([0-9]{${this.numbersOfDecimals}})?$`;

  ngOnInit() {
  }

  getFormModel(surveyId: string) {
    return this.http.get<SurveyModel>(this.base + `/ui/form/model/${surveyId}`);
  }

  getUiVocabularies() {
    return this.http.get<Map<string, string[]>>(this.base + `/ui/vocabularies/map`);
  }

  postItem(surveyId: string, item: any, edit:boolean) {
    return this.http[edit ? 'put' : 'post'](this.base + `/answers/${surveyId}?chapterAnswerId=${item.id}`, item, this.options);
  }

  validateUrl(url: string) {
    // console.log(`knocking on: ${this.base}/provider/validateUrl?urlForValidation=${url}`);
    return this.http.get<boolean>(this.base + `/provider/validateUrl?urlForValidation=${url}`);
  }

  toFormGroup(form: GroupedField[], checkImmutable: boolean) {
    const group: any = {};
    form.forEach(groups => {
      groups.fields.sort((a, b) => a.field.form.display.order - b.field.form.display.order)
      groups.fields.forEach(formField => {
        // console.log(formField.field.name);
        // if (formField.field.form.immutable === checkImmutable) {
          if (formField.field.typeInfo.multiplicity) {
            if (formField.field.typeInfo.type === 'url') {
              group[formField.field.name] = formField.field.form.mandatory ?
                new FormArray([new FormControl('', Validators.compose([Validators.required, Validators.pattern(this.urlRegEx)]))])
                : new FormArray([new FormControl('', Validators.pattern(this.urlRegEx))]);
            } else if (formField.field.typeInfo.type === 'composite') {
              group[formField.field.name] = formField.field.form.mandatory ? new FormArray([], Validators.required)
                : new FormArray([]);
              group[formField.field.name].push(new FormGroup(this.createCompositeField(formField)));
            } else {
              group[formField.field.name] = formField.field.form.mandatory ?
                new FormArray([new FormControl(null, Validators.required)])
                : new FormArray([new FormControl(null)]);
            }
          } else {
            if (formField.field.typeInfo.type === 'url') {
              group[formField.field.name] = formField.field.form.mandatory ?
              new FormControl('', [Validators.required, Validators.pattern(this.urlRegEx)])
                : new FormControl('', Validators.pattern(this.urlRegEx));
            } else if (formField.field.typeInfo.type === 'composite') {
              group[formField.field.name] = new FormGroup(this.createCompositeField(formField));
            } else if (formField.field.typeInfo.type === 'email') {
              group[formField.field.name] = formField.field.form.mandatory ?
                new FormControl('', Validators.compose([Validators.required, Validators.email]))
                : new FormControl('', Validators.email);
            } else if (formField.field.typeInfo.type === 'phone') {
              group[formField.field.name] = formField.field.form.mandatory ?
                new FormControl('', Validators.compose([Validators.required, Validators.pattern('[+]?\\d+$')]))
                : new FormControl('', Validators.pattern('[+]?\\d+$'));
            } else if (formField.field.typeInfo.type === 'number') {
              this.numbersOfDecimals = this.calculateNumberOfDecimals(formField.field.typeInfo.values);
              group[formField.field.name] = formField.field.form.mandatory ?
                new FormControl('', Validators.compose([Validators.required, Validators.pattern(this.numberRegEx)]))
                : new FormControl('', Validators.pattern(this.numberRegEx));
            } else {
              group[formField.field.name] = formField.field.form.mandatory ? new FormControl(null, Validators.required)
                : new FormControl(null);
            }
          }
        // }
      });
    });
    return new FormGroup(group);
  }

  createCompositeField(formField: Fields) {
    const subGroup: any = {};
    // console.log(formField);
    formField.subFieldGroups?.sort((a, b) => a.field.form.display.order - b.field.form.display.order)
    formField.subFieldGroups?.forEach(subField => {
      if (subField.field.typeInfo.type === 'composite' || subField.field.typeInfo.type === 'radioGrid') {
        if (subField.field.typeInfo.multiplicity) {
          subGroup[subField.field.name] = subField.field.form.mandatory ? new FormArray([], Validators.required)
            : new FormArray([]);
          subGroup[subField.field.name].push(new FormGroup(this.createCompositeField(subField)));
        } else {
          subGroup[subField.field.name] = new FormGroup(this.createCompositeField(subField));
        }
      } else if (subField.field.typeInfo.type === 'email') {
        subGroup[subField.field.name] = subField.field.form.mandatory ?
          new FormControl('', Validators.compose([Validators.required, Validators.email]))
          : new FormControl('', Validators.email);
      } else if (subField.field.typeInfo.type === 'phone') {
        subGroup[subField.field.name] = subField.field.form.mandatory ?
          new FormControl('', Validators.compose([Validators.required, Validators.pattern('[+]?\\d+$')]))
          : new FormControl('', Validators.pattern('[+]?\\d+$'));
      } else if (subField.field.typeInfo.multiplicity) { // add array inside composite element
        subGroup[subField.field.name] = subField.field.form.mandatory ?
          new FormArray([new FormControl('', Validators.required)])
          : new FormArray([new FormControl('')]);
      } else if (subField.field.typeInfo.type === 'url') {
        subGroup[subField.field.name] = subField.field.form.mandatory ?
        new FormControl('', [Validators.required, Validators.pattern(this.urlRegEx)])
            : new FormControl('', Validators.pattern(this.urlRegEx));
      } else if (subField.field.typeInfo.type === 'number') {
        subGroup[subField.field.name] = subField.field.form.mandatory ?
          new FormControl('', [Validators.required, Validators.pattern(this.calculateNumberOfDecimals(subField.field.typeInfo.values))])
          : new FormControl('', Validators.pattern(this.calculateNumberOfDecimals(subField.field.typeInfo.values)));
      } else {
        subGroup[subField.field.name] = subField.field.form.mandatory ?
          new FormControl(null, Validators.required)
          : new FormControl(null);
      }
    });
    return  subGroup;
  }

  calculateNumberOfDecimals(values: string[]): string {
    let str = values[0].split('.');
    let decimals: string;

    if (str.length > 0){
        if (str[1].length === 1) {
          decimals = '1';
        } else if (str[1].length === 2) {
          decimals = '0,2';
        }
    } else
      decimals = '0';
    return `^(\\d)*(\\.)?([0-9]{${decimals}})?$`;
  }

  static removeNulls(obj: any) {
    const isArray = obj instanceof Array;
    for (const k in obj) {
      if (obj[k] === null || obj[k] === '') {
        isArray ? obj.splice(k, 1) : delete obj[k];
      } else if (typeof obj[k] === 'object') {
        if (typeof obj[k].value !== 'undefined' && typeof obj[k].lang !== 'undefined') {
          if (obj[k].value === '' && obj[k].lang === 'en') {
            obj[k].lang = '';
          }
        }
        FormControlService.removeNulls(obj[k]);
      }
      if (obj[k] instanceof Array && obj[k].length === 0) {
        delete obj[k];
      } else if (obj[k] instanceof Array) {
        for (const l in obj[k]) {
          if (obj[k][l] === null || obj[k][l] === '') {
            delete obj[k][l];
          }
        }
      }
    }
  }

}
