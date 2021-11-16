import {Component, EventEmitter, Input, OnInit, Output} from "@angular/core";
import {Field, Fields, HandleBitSet, UiVocabulary} from "../../../../domain/dynamic-form-model";
import {FormArray, FormControl, FormGroup, FormGroupDirective, Validators} from "@angular/forms";

@Component({
  selector: 'app-composite-field',
  templateUrl: './composite-field.component.html'
})

export class CompositeFieldComponent implements OnInit {
  @Input() fieldData: Fields;
  @Input() vocabularies: Map<string, string[]>;
  @Input() subVocabularies: UiVocabulary[];
  @Input() editMode: any;
  @Input() position?: number = null;

  @Output() handleBitSets = new EventEmitter<Fields>();
  @Output() handleBitSetsOfComposite = new EventEmitter<HandleBitSet>();

  form: FormGroup;
  hasChanges = false;

  constructor(private rootFormGroup: FormGroupDirective) {
  }

  ngOnInit() {
    // console.log(this.fieldData.field.name);
    if (this.position !== null) {
      // console.log(this.rootFormGroup.control.controls[this.position]);
      // console.log(this.rootFormGroup.control.controls[this.position].get(this.fieldData.field.name));
      this.form = this.rootFormGroup.control.controls[this.position].get(this.fieldData.field.name) as FormGroup;
    } else {
      this.form = this.rootFormGroup.control.get(this.fieldData.field.name) as FormGroup;
      // console.log(this.form);
    }
    // console.log(this.form);
  }

  /** Handle Arrays --> **/
  fieldAsFormArray() {
    return this.form as unknown as FormArray;
  }

  oldFieldAsFormArray(field: string) {
    return this.form.get(field) as FormArray;
  }

  remove(i: number) {
    this.fieldAsFormArray().removeAt(i);
  }

  pushComposite(subFields: Fields[]) {
    this.fieldAsFormArray().push(new FormGroup(this.createCompositeField(subFields)));
  }

  createCompositeField(subFields: Fields[]) {
    const group: any = {};
    subFields.forEach(subField => {
      if (subField.field.typeInfo.type === 'composite') {
        if (subField.field.typeInfo.multiplicity) {
          group[subField.field.name] = subField.field.form.mandatory ? new FormArray([], Validators.required)
            : new FormArray([]);
          console.log(group);
          group[subField.field.name].push(new FormGroup(this.createCompositeField(subField.subFieldGroups)));
          console.log(group);
        } else {
          group[subField.field.name] = new FormGroup(this.createCompositeField(subField.subFieldGroups))
        }
      } else {
        group[subField.field.name] = subField.field.form.mandatory ? new FormControl('', Validators.required)
            : new FormControl('');
      }
    });
    return group;
  }

  // onCompositeChange(field: string, affects: Dependent[], index?: number) {
  onCompositeChange(fieldData: Fields, j?: number, i?: number) {
    // fieldData.subFieldGroups[j].field.parent, fieldData.subFieldGroups[j].field.form.affects
    if (fieldData.subFieldGroups[j].field.form.affects !== null ) {
      fieldData.subFieldGroups[j].field.form.affects.forEach( f => {
        this.oldFieldAsFormArray(fieldData.subFieldGroups[j].field.parent).controls[i].get(f.name).reset();
        this.oldFieldAsFormArray(fieldData.subFieldGroups[j].field.parent).controls[i].get(f.name).enable();
        // this.updateBitSetOfGroup(fieldData, i, f.name, f.id.toString());
      });
    }
  }

  /** <-- Handle Arrays **/

  /** check form fields and tabs validity--> **/

  checkFormValidity(name: string, edit: boolean): boolean {
    return (!this.form.get(name).valid && (edit || this.form.get(name).dirty));
  }

  checkFormArrayValidity(name: string, position: number, edit: boolean, groupName?: string): boolean {
    if (groupName) {
      return (!this.oldFieldAsFormArray(name)?.get([position])?.get(groupName).valid
        && (edit || this.oldFieldAsFormArray(name)?.get([position])?.get(groupName).dirty));

    }
    return (!this.oldFieldAsFormArray(name).get([position]).valid
      && (edit || this.oldFieldAsFormArray(name).get([position]).dirty));
  }

  /** <-- check form fields and tabs validity **/

  /** Return Vocabulary items for composite fields--> **/

  getCompositeVocabularyItems(fieldData: Field) {
    // console.log(fieldData.name);
    // console.log(fieldData.id);
    // console.log(fieldData.typeInfo.vocabulary);
    // console.log(this.vocabularies);
    // if (fieldData.subFieldGroups[j].field.form.dependsOn !== null) {
    //   return this.subVocabularies[this.oldFieldAsFormArray(fieldData.subFieldGroups[j].field.parent).controls[i].get(fieldData.subFieldGroups[j].field.form.dependsOn.name).value];
    // } else {
    // console.log(this.vocabularies[fieldData.typeInfo.vocabulary]);
      return this.vocabularies[fieldData.typeInfo.vocabulary];
    // }
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

  handleCompositeBitsetOfChildren(data: HandleBitSet) {
    this.handleBitSetsOfComposite.emit(data);
  }

  handleBitsetOfChildren(data: Fields) {
    this.handleBitSets.emit(data);
  }

  /** other stuff--> **/
  unsavedChangesPrompt() {
    this.hasChanges = true;
  }

  timeOut(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
