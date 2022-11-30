import {Component, EventEmitter, Input, OnInit, Output} from "@angular/core";
import {Field, HandleBitSet} from "../../../../domain/dynamic-form-model";
import {FormArray, FormControl, FormGroup, FormGroupDirective, Validators} from "@angular/forms";
import {FormControlService} from "../../../../services/form-control.service";

@Component({
  selector: 'app-number-field',
  templateUrl: './number-field.component.html',
  styles: ['.clear-style { height: 0 !important;}']
})

export class NumberFieldComponent implements OnInit {
  @Input() fieldData: Field;
  @Input() editMode: any;
  @Input() position?: number = null;

  @Output() hasChanges = new EventEmitter<boolean>();
  @Output() handleBitSets = new EventEmitter<Field>();
  @Output() handleBitSetsOfComposite = new EventEmitter<HandleBitSet>();

  formControl!: FormControl;
  form!: FormGroup;
  hideField: boolean = null;

  step: string = '';

  constructor(private rootFormGroup: FormGroupDirective, private formControlService: FormControlService) {
  }

  ngOnInit() {
    if (this.position !== null) {
      this.form = this.rootFormGroup.control.controls[this.position] as FormGroup;
    } else {
      this.form = this.rootFormGroup.control;
    }
    this.formControl = this.form.get(this.fieldData.name) as FormControl;

    if (this.fieldData.form.dependsOn) {
      // console.log(this.fieldData.form.dependsOn);
      this.enableDisableField(this.form.get(this.fieldData.form.dependsOn.name).value, this.fieldData.form.dependsOn.value);
      // console.log(this.fieldData.name);
      this.form.get(this.fieldData.form.dependsOn.name).valueChanges.subscribe(value => {
        this.enableDisableField(value, this.fieldData.form.dependsOn.value);
      });
    }

    if (this.fieldData.typeInfo.values) {
      this.step = this.fieldData.typeInfo.values[0]
    }
  }

  /** Handle Arrays --> **/

  fieldAsFormArray() {
    return this.formControl as unknown as FormArray;
  }

  remove(field: string, i: number) {
    this.fieldAsFormArray().removeAt(i);
  }

  /** check fields validity--> **/

  checkFormValidity(): boolean {
    return !( this.formControl.valid || this.formControl.pristine);
  }

  checkFormArrayValidity(name: string, position: number, edit: boolean, groupName?: string): boolean {
    if (groupName) {
      return (!this.fieldAsFormArray()?.get([position])?.get(groupName).valid
        && (edit || this.fieldAsFormArray()?.get([position])?.get(groupName).dirty));

    }
    return (!this.fieldAsFormArray().get([position]).valid
      && (edit || this.fieldAsFormArray().get([position]).dirty));
  }

  /** Bitsets--> **/

  updateBitSet(fieldData: Field) {
    if (fieldData.form.mandatory) {
      this.handleBitSets.emit(fieldData);
    }
  }

  /** other stuff--> **/
  unsavedChangesPrompt() {
    this.hasChanges.emit(true);
  }

  getNumberOfDecimals() {
    if (this.fieldData.typeInfo.values) {
      return this.fieldData.typeInfo.values[0].split('.')[1].length;
    }
    return 0
  }

  enableDisableField(value, enableValue) {
    if (value?.toString() == enableValue) {
      this.formControl.enable();
      this.hideField = false;

    } else {
      this.formControl.disable();
      this.formControl.reset();
      this.hideField = true;
      // maybe add this if the remaining empty fields are a problem
      // (this.formControl as unknown as FormArray).clear();

    }
  }

}
