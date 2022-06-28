import {Component, EventEmitter, Input, OnInit, Output} from "@angular/core";
import {Field, HandleBitSet, UiVocabulary} from "../../../../domain/dynamic-form-model";
import {AbstractControl, FormArray, FormControl, FormGroup, FormGroupDirective, Validators} from "@angular/forms";
import {FormControlService} from "../../../../services/form-control.service";

@Component({
  selector: 'app-choose-one',
  templateUrl: './choose-one.component.html'
})

export class ChooseOneComponent implements OnInit {
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

  constructor(private rootFormGroup: FormGroupDirective, private formService: FormControlService) {
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
  }

  /** Choose one to show **/
  chooseOne(name: string) {
    //
    for (const control in this.form.controls) {
      if (control === name) {
        this.form.setControl(name, new FormGroup(this.formService.createCompositeField(this.fieldData.subFields.find(field => field.name === name))));
        this.form.get(name).enable();
        this.fieldData.subFields.find(field => field.name === name).form.display.visible = true;
      } else {
        this.fieldData.subFields.find(field => field.name === control).form.display.visible = false;
        this.form.setControl(control, new FormControl(null));
        this.form.get(control).disable();
        // this.form.get(control).disabled;
      }
      // this.form.removeControl(control);
    }
    // this.form.addControl(name, new FormGroup(this.formService.createCompositeField(this.fieldData.subFields.find(field => field.name === name))));
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
