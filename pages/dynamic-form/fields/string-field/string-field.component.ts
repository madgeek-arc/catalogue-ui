import {Component, EventEmitter, Input, OnInit, Output} from "@angular/core";
import {Field, HandleBitSet} from "../../../../domain/dynamic-form-model";
import {AbstractControl, FormArray, FormControl, FormGroup, FormGroupDirective} from "@angular/forms";
import {FormControlService} from "../../../../services/form-control.service";

@Component({
  selector: 'app-string-url-email-field',
  templateUrl: './string-field.component.html',
  styles: ['.clear-style { height: 0 !important;}']
})

export class StringFieldComponent implements OnInit {
  @Input() fieldData: Field;
  @Input() editMode: boolean = false;
  @Input() position?: number = null;

  @Output() hasChanges = new EventEmitter<boolean>();
  @Output() handleBitSets = new EventEmitter<Field>();
  @Output() handleBitSetsOfComposite = new EventEmitter<HandleBitSet>();

  formControl!: FormControl;
  form!: FormGroup;
  hideField: boolean = null;

  constructor(private rootFormGroup: FormGroupDirective, private formControlService: FormControlService) {
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
      this.enableDisableField(this.form.get(this.fieldData.form.dependsOn.name).value, this.fieldData.form.dependsOn.value);

      this.form.get(this.fieldData.form.dependsOn.name).valueChanges.subscribe(
        value => {
            this.enableDisableField(value, this.fieldData.form.dependsOn.value);
          },
        error => {console.log(error)}
      );
    }

    // console.log(this.fieldData);
    // console.log(this.form);
    // console.log(this.formControl);
  }

  /** Handle Arrays --> **/

  fieldAsFormArray() {
    return this.formControl as unknown as FormArray;
  }

  push() {
    this.fieldAsFormArray().push(this.formControlService.createField(this.fieldData));
  }

  remove(field: string, i: number) {
    this.fieldAsFormArray().removeAt(i);
  }

  movedElement(e) {
    let newOrder: number[] = [];
    e.target.childNodes.forEach(child => {
      if (Number.isInteger((parseInt(child.id))))
        newOrder.push(child.id);
    });
    for (let i = 0; i < newOrder.length; i++) {
      if (newOrder[i] != i && (newOrder[i] > i+1 || newOrder[i] < i)) {
        this.move(i, newOrder[i]);
        break;
      }
    }
  }

  move(newIndex: number, currentIndex: number) {
    const formArray: FormArray = this.fieldAsFormArray();
    const currentControl: AbstractControl = formArray.at(currentIndex);

    formArray.removeAt(currentIndex);
    formArray.insert(newIndex, currentControl)
  }

  /** check fields validity--> **/

  checkFormValidity(): boolean {
    return (!this.formControl.valid && (this.formControl.touched || this.formControl.dirty));
  }

  checkFormArrayValidity(position: number): boolean {
    const formControl: AbstractControl = this.fieldAsFormArray()?.get([position]);
    // console.log(formControl);
    // console.log(position);
    if (formControl)
      return (!formControl.valid && (formControl.touched || formControl.dirty));
    else
      return false

    // return ((this.fieldAsFormArray().get([position]).invalid && this.fieldAsFormArray().get([position]).touched)
    //   && (this.editMode || this.fieldAsFormArray().get([position]).dirty));
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
    // console.log('string-field.component emitting to parent->');
    this.hasChanges.emit(true);
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

  timeOut(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

}
