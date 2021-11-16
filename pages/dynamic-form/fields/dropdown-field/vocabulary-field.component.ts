import {Component, EventEmitter, Input, OnInit, Output} from "@angular/core";
import {Fields, HandleBitSet, UiVocabulary} from "../../../../domain/dynamic-form-model";
import {FormArray, FormControl, FormGroup, FormGroupDirective, Validators} from "@angular/forms";
import {FormControlService} from "../../../../services/form-control.service";
import {urlAsyncValidator, URLValidator} from "../../../../shared/validators/generic.validator";

@Component({
  selector: 'app-vocabulary-field',
  templateUrl: './vocabulary-field.component.html'
})

export class VocabularyFieldComponent implements OnInit {
  @Input() fieldData: Fields;
  @Input() vocabularies: Map<string, string[]>;
  @Input() subVocabularies: UiVocabulary[];
  @Input() editMode: any;
  @Input() position?: number = null;

  @Output() handleBitSets = new EventEmitter<Fields>();
  @Output() handleBitSetsOfComposite = new EventEmitter<HandleBitSet>();

  formControl!: FormControl;
  form!: FormGroup;
  hasChanges = false;

  constructor(private rootFormGroup: FormGroupDirective, private formControlService: FormControlService) {
  }

  ngOnInit() {
    if (this.position !== null) {
      this.form = this.rootFormGroup.control.controls[this.position] as FormGroup;
    } else {
      this.form = this.rootFormGroup.control;
    }
    this.formControl = this.form.get(this.fieldData.field.name) as FormControl;
    // console.log(this.vocabularies[this.fieldData.field.typeInfo.vocabulary]);
    // console.log(this.fieldData.field.name);
    // console.log(this.formControl);
  }

  /** Handle Arrays --> **/

  fieldAsFormArray() {
    return this.formControl as unknown as FormArray;
  }

  push(field: string, required: boolean, type: string) {
    switch (type) {
      case 'url':
        this.fieldAsFormArray().push(required ? new FormControl('', Validators.compose([Validators.required, URLValidator]), urlAsyncValidator(this.formControlService))
          : new FormControl('', URLValidator, urlAsyncValidator(this.formControlService)));
        break;
      default:
        this.fieldAsFormArray().push(required ? new FormControl('', Validators.required) : new FormControl(''));
    }
  }

  remove(field: string, i: number) {
    this.fieldAsFormArray().removeAt(i);
  }

  /** check fields validity--> **/

  checkFormValidity(): boolean {
    return (!this.formControl.valid && (this.editMode || this.formControl.dirty));
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

  timeOut(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

}
