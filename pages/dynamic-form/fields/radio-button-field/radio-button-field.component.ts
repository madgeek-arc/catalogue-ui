import {Component, EventEmitter, Input, OnInit, Output} from "@angular/core";
import {Field, HandleBitSet} from "../../../../domain/dynamic-form-model";
import {FormControl, FormGroup, FormGroupDirective} from "@angular/forms";

@Component({
  selector: 'app-radio-button-field',
  templateUrl: './radio-button-field.component.html'
})

export class RadioButtonFieldComponent implements OnInit {

  @Input() fieldData: Field;
  @Input() editMode: any;
  @Input() position?: number = null;

  @Output() hasChanges = new EventEmitter<boolean>();
  @Output() handleBitSets = new EventEmitter<Field>();
  @Output() handleBitSetsOfComposite = new EventEmitter<HandleBitSet>();

  formControl!: FormControl;
  form!: FormGroup;

  constructor(private rootFormGroup: FormGroupDirective) {
  }

  ngOnInit() {
    // console.log(this.fieldData);
    if (this.position !== null) {
      this.form = this.rootFormGroup.control.controls[this.position] as FormGroup;
    } else {
      this.form = this.rootFormGroup.control;
    }
    // console.log(this.form);

    this.formControl = this.form.get(this.fieldData.name) as FormControl;
    // console.log(this.formControl);
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

  timeOut(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

}
