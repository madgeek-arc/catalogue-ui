import {Component, EventEmitter, Input, Output} from "@angular/core";
import {Fields, HandleBitSet, UiVocabulary} from "../../../domain/dynamic-form-model";
import {FormArray, FormControl, FormGroup, Validators} from "@angular/forms";

@Component({
  selector: 'app-composite-field',
  templateUrl: './composite-field.component.html'
})

export class CompositeFieldComponent {
  @Input() fieldData: Fields;
  @Input() form: FormGroup;
  @Input() vocabularies: Map<string, UiVocabulary[]>;
  @Input() subVocabularies: UiVocabulary[];
  @Input() editMode: any;

  @Output() handleBitSets = new EventEmitter<Fields>();
  @Output() handleBitSetsOfComposite = new EventEmitter<HandleBitSet>();

  hasChanges = false;

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

  removeFromArrayInsideComposite(parent: string, parentIndex: number, name: string, index: number) {
    const control = <FormArray>this.form.get([parent,parentIndex,name]);
    control.removeAt(index);
  }

  pushToArrayInsideComposite(parent: string, parentIndex: number, name: string, required: boolean) {
    const control = <FormArray>this.form.get([parent,parentIndex,name]);
    control.push(required ? new FormControl('', Validators.required) : new FormControl(''));
  }

  remove(field: string, i: number) {
    this.fieldAsFormArray(field).removeAt(i);
  }

  pushComposite(field: string, subFields: Fields[]) {
    const group: any = {};
    subFields.forEach(subField => {
      if (subField.field.multiplicity) {
        group[subField.field.name] = subField.field.form.mandatory ?
          new FormArray([new FormControl('', Validators.required)])
          : new FormArray([new FormControl('')]);
      } else {
        group[subField.field.name] = subField.field.form.mandatory ? new FormControl('', Validators.required)
          : new FormControl('');
      }

      if (subField.field.form.dependsOn !== null) {
        group[subField.field.name].disable();
      }
    });
    this.fieldAsFormArray(field).push(new FormGroup(group));
  }

  // onCompositeChange(field: string, affects: Dependent[], index?: number) {
  onCompositeChange(fieldData: Fields, j?: number, i?: number) {
    // fieldData.subFieldGroups[j].field.parent, fieldData.subFieldGroups[j].field.form.affects
    if (fieldData.subFieldGroups[j].field.form.affects !== null ) {
      fieldData.subFieldGroups[j].field.form.affects.forEach( f => {
        this.fieldAsFormArray(fieldData.subFieldGroups[j].field.parent).controls[i].get(f.name).reset();
        this.fieldAsFormArray(fieldData.subFieldGroups[j].field.parent).controls[i].get(f.name).enable();
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

  getCompositeVocabularyItems(fieldData: Fields, j: number, i?: number) {
    if (fieldData.subFieldGroups[j].field.form.dependsOn !== null) {
      return this.subVocabularies[this.fieldAsFormArray(fieldData.subFieldGroups[j].field.parent).controls[i].get(fieldData.subFieldGroups[j].field.form.dependsOn.name).value];
    } else {
      return this.vocabularies[fieldData.subFieldGroups[j].field.form.vocabulary];
    }
  }

  /** <--Return Vocabulary items for composite fields **/

  updateBitSet(fieldData: Fields) {
    this.timeOut(200).then(() => { // Needed for radio buttons strange behaviour
      if (fieldData.field.form.mandatory) {
        this.handleBitSets.emit(fieldData);
      }
    });
  }

  updateBitSetOfComposite(fieldData: Fields, position: number) {
    if (fieldData.field.form.mandatory) {
      let tmp = new HandleBitSet();
      tmp.field = fieldData;
      tmp.position = position;
      this.handleBitSetsOfComposite.emit(tmp);
    }
  }

  unsavedChangesPrompt() {
    this.hasChanges = true;
  }

  timeOut(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
