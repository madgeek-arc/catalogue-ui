import {Injectable} from '@angular/core';
import {FormArray, FormControl, FormGroup, Validators} from '@angular/forms';

import {Field, Fields, FormModel, UiVocabulary} from '../domain/dynamic-form-model';
import {urlAsyncValidator, URLValidator} from '../shared/validators/generic.validator';
import {environment} from '../../environments/environment';
import {HttpClient} from '@angular/common/http';

@Injectable()
export class FormControlService {
  constructor(public http: HttpClient) { }

  base = environment.API_ENDPOINT;
  private options = {withCredentials: true};

  getFormModel() {
    return this.http.get<FormModel[]>(this.base + '/ui/form/model');
  }

  getUiVocabularies() {
    return this.http.get<Map<string, UiVocabulary[]>>(this.base + `/ui/vocabularies`);
  }

  getDynamicService(id: string) {
    return this.http.get(this.base + `/ui/services/${id}/`, this.options);
  }

  postDynamicService(service: any, edit:boolean) {
    return this.http[edit ? 'put' : 'post'](this.base + '/ui/services', service, this.options);
  }

  toFormGroup(form: FormModel[], checkImmutable: boolean) {
    const group: any = {};
    form.forEach(groups => {
      groups.fields.sort((a, b) => a.field.form.order - b.field.form.order)
      groups.fields.forEach(formField => {
        // console.log(formField.field.name);
        // if (formField.field.form.immutable === checkImmutable) {
          if (formField.field.typeInfo.multiplicity) {
            if (formField.field.typeInfo.type === 'url') {
              group[formField.field.name] = formField.field.form.mandatory ?
                new FormArray([new FormControl('', Validators.compose([Validators.required, URLValidator]), urlAsyncValidator(this))])
                : new FormArray([new FormControl('', URLValidator, urlAsyncValidator(this))]);
            } else if (formField.field.typeInfo.type === 'composite') {
              group[formField.field.name] = formField.field.form.mandatory ? new FormArray([], Validators.required)
                : new FormArray([]);
              group[formField.field.name].push(new FormGroup(this.createCompositeField(formField)));
            } else {
              group[formField.field.name] = formField.field.form.mandatory ?
                new FormArray([new FormControl('', Validators.required)])
                : new FormArray([new FormControl('')]);
            }
          } else {
            if (formField.field.typeInfo.type === 'url') {
              group[formField.field.name] = formField.field.form.mandatory ?
                new FormControl('', Validators.compose([Validators.required, URLValidator]), urlAsyncValidator(this))
                : new FormControl('', URLValidator, urlAsyncValidator(this));
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
            } else {
              group[formField.field.name] = formField.field.form.mandatory ? new FormControl('', Validators.required)
                : new FormControl('');
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
    formField.subFieldGroups.forEach(subField => {
      if (subField.field.typeInfo.type === 'composite') {
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
      }
      else {
        subGroup[subField.field.name] = subField.field.form.mandatory ?
          new FormControl('', Validators.required)
          : new FormControl('');
      }
      if (subField.field.form.dependsOn !== null) {
        // console.log(subField.field.name);
        // subGroup[subField.field.name].disable(); // to be fixed
      }
    });
    return  subGroup;
  }

  validateUrl(url: string) {
    // console.log(`knocking on: ${this.base}/provider/validateUrl?urlForValidation=${url}`);
    return this.http.get<boolean>(this.base + `/provider/validateUrl?urlForValidation=${url}`);
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
