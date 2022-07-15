import {Component, EventEmitter, Input, OnInit, Output} from "@angular/core";
import {Field, HandleBitSet} from "../../../../domain/dynamic-form-model";
import {FormArray, FormControl, FormGroup, FormGroupDirective, Validators} from "@angular/forms";

@Component({
  selector: 'app-date-field',
  templateUrl: 'date-field.component.html'
})

export class DateFieldComponent implements OnInit {

  @Input() fieldData: Field;
  @Input() editMode: any;
  @Input() position?: number = null;

  @Output() hasChanges = new EventEmitter<boolean>();
  @Output() handleBitSets = new EventEmitter<Field>();
  @Output() handleBitSetsOfComposite = new EventEmitter<HandleBitSet>();

  formControl!: FormControl;
  form!: FormGroup;
  hideFields: boolean = null;

  constructor(private rootFormGroup: FormGroupDirective) {
  }

  ngOnInit() {
    if (this.position !== null) {
      this.form = this.rootFormGroup.control.controls[this.position] as FormGroup;
    } else {
      this.form = this.rootFormGroup.control;
    }
    this.formControl = this.form.get(this.fieldData.name) as FormControl;

    if(this.fieldData.form.dependsOn) {
      // console.log(this.fieldData.form.dependsOn);
      this.enableDisableField(this.form.get(this.fieldData.form.dependsOn.name).value);

      this.form.get(this.fieldData.form.dependsOn.name).valueChanges.subscribe(value => {
        this.enableDisableField(value);
      });
    }

    // console.log(this.fieldData);
    // console.log(this.form);
    // console.log(this.formControl);
  }

  /** Handle Arrays --> **/

  fieldAsFormArray() {
    return this.formControl as unknown as FormArray;
  }

  push(field: string, required: boolean, type?: string) {
    this.fieldAsFormArray().push(required ? new FormControl('', Validators.required) : new FormControl(''));
  }

  remove(field: string, i: number) {
    this.fieldAsFormArray().removeAt(i);
  }

  /** check fields validity--> **/

  checkFormValidity(): boolean {
    return (!this.formControl.valid && (this.formControl.touched || this.formControl.dirty));
  }

  /** Bitsets--> **/

  updateBitSet(fieldData: Field) {
    this.timeOut(200).then(() => { // Needed for radio buttons strange behaviour
      if (fieldData.form.mandatory) {
        this.handleBitSets.emit(fieldData);
      }
    });
  }


  /** other stuff--> **/
  unsavedChangesPrompt() {
    this.hasChanges.emit(true);
  }

  enableDisableField(value: boolean) {
    if (!value) {
      this.formControl.reset(null);
      this.formControl.disable();
      this.hideFields = true;
    } else {
      this.formControl.enable();
      if (!this.formControl.value) {
        this.formControl.setValue('');
      }
      this.hideFields = false;
    }
  }

  timeOut(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

}
