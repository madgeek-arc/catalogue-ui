import { Component, EventEmitter, OnInit, Output } from "@angular/core";
import { UntypedFormControl, UntypedFormGroup } from "@angular/forms";
import { Field, HandleBitSet } from "../../../../domain/dynamic-form-model";
import { BaseFieldComponent } from "../base-field.component";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
  selector: 'app-large-text-field',
  templateUrl: './large-text-field.component.html'
})

export class LargeTextFieldComponent extends BaseFieldComponent implements OnInit {

  @Output() handleBitSets = new EventEmitter<Field>();
  @Output() handleBitSetsOfComposite = new EventEmitter<HandleBitSet>();

  active = false;

  ngOnInit() {
    if (this.position !== null) {
      this.form = this.rootFormGroup.control.controls[this.position] as UntypedFormGroup;
    } else {
      this.form = this.rootFormGroup.control;
    }
    // console.log(this.form);
    this.formControl = this.form.get(this.fieldData.name) as UntypedFormControl;


    // Subscribe and emit field value change
    // this.formControl.valueChanges.pipe(
    //   takeUntilDestroyed(this.destroyRef),
    //   debounceTime(1000),
    //   distinctUntilChanged()).subscribe({
    //   next: value => {
    //     console.log(this.editMode);
    //
    //   }
    // })

    // this.wsService.msg.subscribe({
    //   next: value => {
    //     value?.forEach(user => {
    //       console.log(user.position);
    //       if (this.fieldData.name === user.position) {
    //         this.active = true;
    //         return;
    //       }
    //       this.active = false;
    //     })
    //     // console.log(value)
    //   }
    // })

    if(this.fieldData.form.dependsOn) {
      // console.log(this.fieldData.form.dependsOn);
      this.enableDisableField(this.form.get(this.fieldData.form.dependsOn.name).value, this.fieldData.form.dependsOn.value);

      this.form.get(this.fieldData.form.dependsOn.name).valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(
        value => {
          this.enableDisableField(value, this.fieldData.form.dependsOn.value);
        },
        error => {console.log(error)}
      );
    }
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

