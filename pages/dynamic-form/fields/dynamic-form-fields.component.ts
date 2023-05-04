import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {FormArray, FormControl, FormGroup, Validators} from '@angular/forms';

import {Field, HandleBitSet, UiVocabulary} from '../../../domain/dynamic-form-model';
import {urlAsyncValidator, URLValidator} from '../../../shared/validators/generic.validator';
import {FormControlService} from "../../../services/form-control.service";

@Component({
  selector: 'app-field',
  templateUrl: './dynamic-form-fields.component.html'
})
export class DynamicFormFieldsComponent implements OnInit {
  @Input() fieldData: Field;
  @Input() form: FormGroup;
  @Input() vocabularies: Map<string, object[]>;
  @Input() subVocabularies: UiVocabulary[];
  @Input() editMode: any;

  @Output() hasChanges = new EventEmitter<boolean>();
  @Output() handleBitSets = new EventEmitter<Field>();
  @Output() handleBitSetsOfComposite = new EventEmitter<HandleBitSet>();


  constructor(private formControlService: FormControlService) { }

  ngOnInit() {
    // console.log(this.form.value);
  }

  /** Handle Arrays --> **/
  fieldAsFormArray(field: string) {
    return this.form.get(field) as FormArray;
  }

  compositeFormArray(parent: string, parentIndex: number, name: string) {
    // console.log(parent+', '+parentIndex+', '+name);
    // console.log(this.form.get([parent,parentIndex,name]));
    // return this.form.get([parent,parentIndex,name]) as FormArray;
    let control = this.form.get(parent) as FormArray;
    return control.controls[parentIndex].get(name) as FormArray;
  }

  push(field: string, required: boolean, type: string) {
    switch (type) {
      case 'url':
        this.fieldAsFormArray(field).push(required ? new FormControl('', Validators.compose([Validators.required, URLValidator]), urlAsyncValidator(this.formControlService))
          : new FormControl('', URLValidator, urlAsyncValidator(this.formControlService)));
        break;
      default:
        this.fieldAsFormArray(field).push(required ? new FormControl('', Validators.required) : new FormControl(''));
    }
  }

  pushToArrayInsideComposite(parent: string, parentIndex: number, name: string, required: boolean) {
    const control = <FormArray>this.form.get([parent,parentIndex,name]);
    control.push(required ? new FormControl('', Validators.required) : new FormControl(''));
  }

  removeFromArrayInsideComposite(parent: string, parentIndex: number, name: string, index: number) {
    const control = <FormArray>this.form.get([parent,parentIndex,name]);
    control.removeAt(index);
  }

  remove(field: string, i: number) {
    this.fieldAsFormArray(field).removeAt(i);
  }

  pushComposite(field: string, subFields: Field[]) {
    const group: any = {};
    subFields.forEach(subField => {
      if (subField.typeInfo.multiplicity) {
        group[subField.name] = subField.form.mandatory ?
          new FormArray([new FormControl('', Validators.required)])
          : new FormArray([new FormControl('')]);
      } else {
        group[subField.name] = subField.form.mandatory ? new FormControl('', Validators.required)
          : new FormControl('');
      }

      if (subField.form.dependsOn !== null) {
        group[subField.name].disable();
      }
    });
    this.fieldAsFormArray(field).push(new FormGroup(group));
  }

  // onCompositeChange(field: string, affects: Dependent[], index?: number) {
  onCompositeChange(fieldData: Field, j?: number, i?: number) {
    // fieldData.subFields[j].parent, fieldData.subFields[j].form.affects
    if (fieldData.subFields[j].form.affects !== null ) {
      fieldData.subFields[j].form.affects.forEach(f => {
        this.fieldAsFormArray(fieldData.subFields[j].parent).controls[i].get(f.name).reset();
        this.fieldAsFormArray(fieldData.subFields[j].parent).controls[i].get(f.name).enable();
        // this.updateBitSetOfGroup(fieldData, i, f.name, f.id.toString());
      });
    }
  }

  /** <-- Handle Arrays **/

  /** check form fields and tabs validity--> **/

  checkFormValidity(name: string, edit: boolean): boolean {
    // console.log(name);
    // return (!this.form.get(name).valid && (edit || this.form.get(name).dirty));
    return true;
  }

  checkFormArrayValidity(name: string, position: number, edit: boolean, groupName?: string): boolean {
    if (groupName) {
      return (!this.fieldAsFormArray(name)?.get([position])?.get(groupName).valid
        && (edit || this.fieldAsFormArray(name)?.get([position])?.get(groupName).dirty));

    }
    return (!this.fieldAsFormArray(name).get([position]).valid
      && (edit || this.fieldAsFormArray(name).get([position]).dirty));
  }

  /** <-- check form fields and tabs validity **/

  /** Return Vocabulary items for composite fields--> **/

  getCompositeVocabularyItems(fieldData: Field, j: number, i?: number) {
    if (fieldData.subFields[j].form.dependsOn !== null) {
      return this.subVocabularies[this.fieldAsFormArray(fieldData.subFields[j].parent).controls[i].get(fieldData.subFields[j].form.dependsOn.name).value];
    } else {
      return this.vocabularies[fieldData.subFields[j].form.vocabulary];
    }
  }

  /** <--Return Vocabulary items for composite fields **/

  /** Bitsets--> **/

  updateBitSet(fieldData: Field) {
    this.timeOut(200).then(() => { // Needed for radio buttons strange behaviour
      if (fieldData.form.mandatory) {
        this.handleBitSets.emit(fieldData);
      }
    });
  }

  updateBitSetOfComposite(fieldData: Field, position: number) {
    if (fieldData.form.mandatory) {
      let tmp = new HandleBitSet();
      tmp.field = fieldData;
      tmp.position = position;
      this.handleBitSetsOfComposite.emit(tmp);
    }
  }

  handleCompositeBitsetOfChildren(data: HandleBitSet) {
    this.handleBitSetsOfComposite.emit(data);
  }

  handleBitsetOfChildren(data: Field) {
    this.handleBitSets.emit(data);
  }

  unsavedChangesPrompt() {
    this.hasChanges.emit(true);
  }

  timeOut(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // printToConsole(name: string) {
  //   console.log(this.form.get(name).valid)
  // }

}
