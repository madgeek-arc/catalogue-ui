import {Component, EventEmitter, Input, OnInit, Output} from "@angular/core";
import {Fields, HandleBitSet} from "../../../../domain/dynamic-form-model";
import {FormArray, FormControl, FormGroup, FormGroupDirective, Validators} from "@angular/forms";
import {FormControlService} from "../../../../services/form-control.service";
import {urlAsyncValidator, URLValidator} from "../../../../shared/validators/generic.validator";

@Component({
  selector: 'app-date-field',
  templateUrl: 'date-field.component.html'
})

export class DateFieldComponent implements OnInit {

  @Input() fieldData: Fields;
  @Input() editMode: any;
  @Input() position?: number = null;

  @Output() handleBitSets = new EventEmitter<Fields>();
  @Output() handleBitSetsOfComposite = new EventEmitter<HandleBitSet>();

  formControl!: FormControl;
  form!: FormGroup;
  hasChanges = false;

  constructor(private rootFormGroup: FormGroupDirective) {
  }

  ngOnInit() {
    if (this.position !== null) {
      this.form = this.rootFormGroup.control.controls[this.position] as FormGroup;
    } else {
      this.form = this.rootFormGroup.control;
    }
    this.formControl = this.form.get(this.fieldData.field.name) as FormControl;

    if(this.fieldData.field.form.dependsOn) {
      // console.log(this.fieldData.field.form.dependsOn);
      this.enableDisableField(this.form.get(this.fieldData.field.form.dependsOn.name).value);

      this.form.get(this.fieldData.field.form.dependsOn.name).valueChanges.subscribe(value => {
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
    return (!this.formControl.valid && (this.editMode || this.formControl.dirty));
  }

  /** Bitsets--> **/

  updateBitSet(fieldData: Fields) {
    this.timeOut(200).then(() => { // Needed for radio buttons strange behaviour
      if (fieldData.field.form.mandatory) {
        this.handleBitSets.emit(fieldData);
      }
    });
  }


  /** other stuff--> **/
  unsavedChangesPrompt() {
    this.hasChanges = true;
  }

  enableDisableField(value: boolean) {
    if (!value) {
      this.formControl.disable();
      this.formControl.reset();
    } else {
      this.formControl.enable();
    }
  }

  timeOut(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

}
