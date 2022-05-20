import {Component, EventEmitter, Input, OnInit, Output} from "@angular/core";
import {Field, HandleBitSet, UiVocabulary} from "../../../../domain/dynamic-form-model";
import {FormArray, FormControl, FormGroup, FormGroupDirective, Validators} from "@angular/forms";

@Component({
  selector: 'app-composite-field',
  templateUrl: './composite-field.component.html'
})

export class CompositeFieldComponent implements OnInit {
  @Input() fieldData: Field;
  @Input() vocabularies: Map<string, string[]>;
  @Input() subVocabularies: UiVocabulary[];
  @Input() editMode: any;
  @Input() position?: number = null;

  @Output() hasChanges = new EventEmitter<boolean>();
  @Output() handleBitSets = new EventEmitter<Field>();
  @Output() handleBitSetsOfComposite = new EventEmitter<HandleBitSet>();

  form: FormGroup;
  hideField: boolean = null;

  constructor(private rootFormGroup: FormGroupDirective) {
  }

  ngOnInit() {
    // console.log(this.fieldData.name);
    if (this.position !== null) {
      // console.log(this.rootFormGroup.control.controls[this.position]);
      // console.log(this.rootFormGroup.control.controls[this.position].get(this.fieldData.name));
      this.form = this.rootFormGroup.control.controls[this.position].get(this.fieldData.name) as FormGroup;
    } else {
      this.form = this.rootFormGroup.control.get(this.fieldData.name) as FormGroup;
      // console.log(this.form);
    }
    // console.log(this.form);
    if(this.fieldData.form.dependsOn) { // specific changes for composite field, maybe revise it
      this.enableDisableField(this.rootFormGroup.form.get(this.fieldData.form.dependsOn.name).value);

      this.rootFormGroup.form.get(this.fieldData.form.dependsOn.name).valueChanges.subscribe(value => {
        this.enableDisableField(value);
      });
    }
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

  pushComposite(subFields: Field[]) {
    this.fieldAsFormArray().push(new FormGroup(this.createCompositeField(subFields)));
  }

  createCompositeField(subFields: Field[]) {
    const group: any = {};
    subFields.forEach(subField => {
      if (subField.typeInfo.type === 'composite') {
        if (subField.typeInfo.multiplicity) {
          group[subField.name] = subField.form.mandatory ? new FormArray([], Validators.required)
            : new FormArray([]);
          group[subField.name].push(new FormGroup(this.createCompositeField(subField.subFields)));
        } else {
          group[subField.name] = new FormGroup(this.createCompositeField(subField.subFields))
        }
      } else {
        group[subField.name] = subField.form.mandatory ? new FormControl('', Validators.required)
            : new FormControl('');
      }
    });
    return group;
  }

  // onCompositeChange(field: string, affects: Dependent[], index?: number) {
  onCompositeChange(fieldData: Field, j?: number, i?: number) {
    // fieldData.subFields[j].parent, fieldData.subFields[j].form.affects
    if (fieldData.subFields[j].form.affects !== null ) {
      fieldData.subFields[j].form.affects.forEach(f => {
        this.oldFieldAsFormArray(fieldData.subFields[j].parent).controls[i].get(f.name).reset();
        this.oldFieldAsFormArray(fieldData.subFields[j].parent).controls[i].get(f.name).enable();
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
    // if (fieldData.subFields[j].form.dependsOn !== null) {
    //   return this.subVocabularies[this.oldFieldAsFormArray(fieldData.subFields[j].parent).controls[i].get(fieldData.subFields[j].form.dependsOn.name).value];
    // } else {
    // console.log(this.vocabularies[fieldData.typeInfo.vocabulary]);
      return this.vocabularies[fieldData.typeInfo.vocabulary];
    // }
  }

  /** <--Return Vocabulary items for composite fields **/

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

  /** other stuff--> **/
  unsavedChangesPrompt() {
    this.hasChanges.emit(true);
  }

  timeOut(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  enableDisableField(value) {
    // console.log(value);
    if (value === 'Applicable') {
      this.form.enable();
      this.hideField = false;

    } else {
      this.form.disable();
      this.form.reset();
      this.hideField = true;
      // maybe add this if the remaining empty fields are a problem
      // (this.formControl as unknown as FormArray).clear();

    }
  }
}
