import {AfterContentInit, Component, EventEmitter, Input, Output} from "@angular/core";
import {Field, HandleBitSet} from "../../../../domain/dynamic-form-model";
import {FormControl, FormGroup, FormGroupDirective} from "@angular/forms";
import {FormControlService} from "../../../../services/form-control.service";

@Component({
  selector: 'app-scale-field',
  templateUrl: 'scale-field.component.html',
  styleUrls: ['scale-field.component.scss'],
  styles: ['.clear-style { height: 0 !important;}']
})

export class ScaleFieldComponent implements AfterContentInit {

  @Input() fieldData: Field;
  @Input() editMode: boolean = false;
  @Input() position?: number = null;

  @Output() hasChanges = new EventEmitter<boolean>();
  @Output() handleBitSets = new EventEmitter<Field>();
  @Output() handleBitSetsOfComposite = new EventEmitter<HandleBitSet>();

  formControl!: FormControl;
  form!: FormGroup;
  hideField: boolean = null;
  iterationArr: any[];

  constructor(private rootFormGroup: FormGroupDirective, private formControlService: FormControlService) {}

  ngAfterContentInit() {
    if (this.position !== null) {
      this.form = this.rootFormGroup.control.controls[this.position] as FormGroup;
    } else {
      this.form = this.rootFormGroup.control;
    }
    this.formControl = this.form.get(this.fieldData.name) as FormControl;

    this.iterationArr = new Array(+this.fieldData.typeInfo.values[0]);

    this.formControl = this.form.get(this.fieldData.name) as FormControl;
    if(this.fieldData.form.dependsOn) {
      this.enableDisableField(this.form.get(this.fieldData.form.dependsOn.name).value, this.fieldData.form.dependsOn.value);
      this.form.get(this.fieldData.form.dependsOn.name).valueChanges.subscribe(value => {
        this.enableDisableField(value, this.fieldData.form.dependsOn.value);
      }, error => {console.log(error)});
    }
  }

  checkFormValidity(): boolean {
    return (!this.formControl.valid && (this.formControl.touched || this.formControl.dirty));
  }

  /** other stuff--> **/
  enableDisableField(value, enableValue) {

    if (value === enableValue) {
      this.formControl.enable();
      this.hideField = false;

    } else {
      this.formControl.disable();
      this.formControl.reset();
      this.hideField = true;
    }

  }

  unsavedChangesPrompt() {
    this.hasChanges.emit(true);
  }
}
