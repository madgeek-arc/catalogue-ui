import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormArray, FormControl, UntypedFormArray, UntypedFormGroup, Validators } from '@angular/forms';
import { phoneRegEx, urlRegEx } from "../shared/validators/generic.validator";
import { Field, NumberProperties, PatternProperties, Required, Section } from '../domain/dynamic-form-model';

@Injectable()
export class FormControlService {
  constructor(public http: HttpClient) { }

  readonly urlRegEx = urlRegEx;
  readonly phoneValidationPattern = phoneRegEx;

  // base = environment.API_ENDPOINT;


  // postItem(surveyId: string, item: any, edit:boolean) {
  //   return this.http[edit ? 'put' : 'post'](this.base + `/answers/${surveyId}/answer`, item, this.options);
  // }
  //
  // postGenericItem(resourceType: string, item, edit?: boolean) {
  //   // console.log(item[Object.keys(item)[0]]);
  //   return this.http.post(this.base + `/items?resourceType=${resourceType}`, item[Object.keys(item)[0]]);
  // }

  // validateUrl(url: string) {
  //   // console.log(`knocking on: ${this.base}/provider/validateUrl?urlForValidation=${url}`);
  //   return this.http.get<boolean>(this.base + `/provider/validateUrl?urlForValidation=${url}`);
  // }

  toFormGroup(form: Section[], checkImmutable: boolean) {
    const group: any = {};
    form.forEach(groups => {
      groups.fields.sort((a, b) => a.form.display?.order - b.form.display?.order)
      groups.required = new Required();
      groups.fields.forEach(formField => {
        if (formField.deprecated)
          return;

        if (formField.form.mandatory) {
          groups.required.topLevel++;
          groups.required.total++;
        }
        // if (formField.form.immutable === checkImmutable) {
          if (formField.typeInfo.multiplicity) {

            if (formField.typeInfo.type === 'composite' || formField.typeInfo.type === 'chooseOne') {
              group[formField.name] = formField.form.mandatory ? new UntypedFormArray([], Validators.required)
                : new UntypedFormArray([]);
              group[formField.name].push(this.createCompositeField(formField));
            } else if (formField.typeInfo.type === 'select') { // Special treatment for select fields with multiselect
              group[formField.name] = formField.form.mandatory ?
                new FormControl<string[] | null>(null, Validators.required) : new FormControl<string[] | null>(null);
            } else {
              group[formField.name] = formField.form.mandatory ?
                new FormArray([this.createField(formField)], Validators.required) : new FormArray([this.createField(formField)]);
            }
          } else {
            if (formField.typeInfo.type === 'composite' || formField.typeInfo.type === 'chooseOne') {
              if (group.hasOwnProperty(formField.name)) { // merge the controls to one formGroup
                (group[formField.name] as UntypedFormGroup).controls = {...(group[formField.name] as UntypedFormGroup).controls, ...this.createCompositeField(formField).controls}
              } else
                group[formField.name] = this.createCompositeField(formField);
            }
            else
              group[formField.name] = this.createField(formField);
          }
        // }
      });
    });
    return new UntypedFormGroup(group);
  }

  createCompositeField(formField: Field) {
    const subGroup: any = {};
    // console.log(formField);
    formField.subFields?.sort((a, b) => a.form.display?.order - b.form.display?.order)
    formField.subFields?.forEach(subField => {
      if (subField.deprecated)
        return;

      if (subField.typeInfo.type === 'composite') {
        if (subField.typeInfo.multiplicity) {
          subGroup[subField.name] = subField.form.mandatory ?
            new UntypedFormArray([], Validators.required) : new UntypedFormArray([]);
          subGroup[subField.name].push(this.createCompositeField(subField));
        } else {
          subGroup[subField.name] = this.createCompositeField(subField);
        }
      } else if (subField.typeInfo.multiplicity) { // add an array inside composite element
        // subGroup[subField.name] = subField.form.mandatory ?
        //   new UntypedFormArray([new UntypedFormControl(null, Validators.required)])
        //   : new UntypedFormArray([new UntypedFormControl(null)]);

        if (subField.typeInfo.type === 'select') { // Special treatment for select fields with multiselect
          subGroup[subField.name] = subField.form.mandatory ?
            new FormControl<string[] | null>(null, Validators.required) : new FormControl<string[] | null>(null);
        } else {
          subGroup[subField.name] = subField.form.mandatory ?
            new FormArray([this.createField(subField)], Validators.required) : new FormArray([this.createField(subField)]);
        }

      } else
        subGroup[subField.name] = this.createField(subField);

      //   if (subField.typeInfo.type === 'email') {
      //   subGroup[subField.name] = subField.form.mandatory ?
      //     new UntypedFormControl(null, Validators.compose([Validators.required, Validators.email]))
      //     : new UntypedFormControl(null, Validators.email);
      // } else if (subField.typeInfo.type === 'phone') {
      //   let pattern = (formField.typeInfo.properties as PatternProperties).pattern ?? this.phoneValidationPattern;
      //   subGroup[subField.name] = subField.form.mandatory ?
      //     new UntypedFormControl(null, Validators.compose([Validators.required, Validators.pattern(pattern)]))
      //     : new UntypedFormControl(null, Validators.pattern(pattern));
      // } else if (subField.typeInfo.type === 'url') {
      //   subGroup[subField.name] = subField.form.mandatory ?
      //   new UntypedFormControl(null, [Validators.required, Validators.pattern(this.urlRegEx)])
      //       : new UntypedFormControl(null, Validators.pattern(this.urlRegEx));
      // } else if (subField.typeInfo.type === 'number') {
      //   const pattern = this.numberRegex((formField.typeInfo.properties as NumberProperties).decimals);
      //   subGroup[subField.name] = subField.form.mandatory ?
      //     new UntypedFormControl(null, [Validators.required, Validators.pattern(pattern)])
      //     : new UntypedFormControl(null, Validators.compose([Validators.pattern(pattern)]));
      // } else if (subField.typeInfo.type === 'bool') {
      //   subGroup[subField.name] = new FormControl<boolean | null>(null);
      //   if (subField.form.mandatory)
      //     subGroup[subField.name].setValidators(Validators.required);
      // } else {
      //   subGroup[subField.name] = subField.form.mandatory ?
      //     new UntypedFormControl(null, Validators.required) : new UntypedFormControl(null);
      // }
    });
    return new UntypedFormGroup(subGroup);
  }

  createField (formField: Field): FormControl | UntypedFormGroup {
    if (formField.typeInfo.type === 'url') {
      return formField.form.mandatory ?
        new FormControl<string | null>(null, [Validators.required, Validators.pattern(this.urlRegEx)])
        : new FormControl<string | null>(null, Validators.pattern(this.urlRegEx));
    } else if (formField.typeInfo.type === 'composite' || formField.typeInfo.type === 'chooseOne') {
      return this.createCompositeField(formField);
    } else if (formField.typeInfo.type === 'email') {
      return formField.form.mandatory ?
        new FormControl<string | null>(null, Validators.compose([Validators.required, Validators.email]))
        : new FormControl<string | null>(null, Validators.email);
    } else if (formField.typeInfo.type === 'phone') {
      let pattern = (formField.typeInfo.properties as PatternProperties).pattern ?? this.phoneValidationPattern;
      return formField.form.mandatory ?
        new FormControl<string | null>(null, Validators.compose([Validators.required, Validators.pattern(pattern)]))
        : new FormControl<string | null>(null, Validators.pattern(pattern));
    } else if (formField.typeInfo.type === 'number') {
      const pattern = this.numberRegex((formField.typeInfo.properties as NumberProperties).decimals);
      return formField.form.mandatory ?
        new FormControl<number | null>(null, Validators.compose([Validators.required, Validators.pattern(pattern)]))
        : new FormControl<number | null>(null, Validators.compose([Validators.pattern(pattern)]));
    } else if (formField.typeInfo.type === 'string') {
      return formField.form.mandatory ?
        new FormControl<string | null>(null, Validators.required)
        : new FormControl<string | null>(null);
    } else if (formField.typeInfo.type === 'checkbox' || formField.typeInfo.type === 'bool') {
      return formField.form.mandatory ?
        new FormControl<boolean | null>(null, Validators.required) : new FormControl<boolean | null>(null);
    } else {
      return formField.form.mandatory ?
        new FormControl<string | null>(null, Validators.required) : new FormControl<string | null>(null);
    }
  }

  numberRegex(decimals: number): string {
    // return `^(\\d)*(\\.)?([0-9]{0,${decimals}})?$`;
    if (decimals === 0)
      return '^(\\d)*$';

    return `^(\\d)+(\\.\\d{1,${decimals}})?$`;

  }

  static removeNulls(obj: any) {
    const isArray = obj instanceof Array;
    for (const k in obj) {
      if (obj[k] === null || obj[k] === '') {
        // TODO: check 'obj.splice(k, 1)', is k supposed to be a number? if not then fix this method
        isArray ? obj.splice(+k, 1) : delete obj[k];
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
