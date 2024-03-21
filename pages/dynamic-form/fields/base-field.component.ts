import { Component, DestroyRef, EventEmitter, inject, Input, Output } from "@angular/core";
import {
  AbstractControl,
  FormArray,
  FormGroup,
  FormGroupDirective,
  UntypedFormControl,
  UntypedFormGroup
} from "@angular/forms";
import { Field } from "../../../domain/dynamic-form-model";
import { WebsocketService } from "../../../../app/services/websocket.service";

@Component({
  template: ``
})

export class BaseFieldComponent {

  protected destroyRef = inject(DestroyRef);

  @Input() fieldData: Field;
  @Input() editMode: boolean;
  @Input() readonly: boolean = null;
  @Input() position?: number = null;

  @Output() hasChanges = new EventEmitter<boolean>();

  formControl!: UntypedFormControl;
  form!: UntypedFormGroup;
  hideField: boolean = null;

  constructor(protected rootFormGroup: FormGroupDirective, private wsService: WebsocketService) {
  }

  /** Field focus -------------------------------------------------------------------------------------------------> **/
  focus(toggle: boolean) {
    this.wsService.WsEdit('sa-nQqVpWzP', 'surveyAnswer', this.fieldData.name, this.fieldData.name);
  }

  focusOut() {

  }
  /** <------------------------------------------------------------------------------------------------- Field focus **/

  /** Form control path -------------------------------------------------------------------------------------------> **/
  getPath(control: AbstractControl): string[] {
    const path: string[] = [];
    let currentControl: AbstractControl | null = control;

    // Traverse up the tree until reaching the root
    while (currentControl && currentControl.parent) {
      if (currentControl.parent instanceof FormArray) {
        const index = this.findIndexInFormArray(currentControl.parent, currentControl);
        path.unshift(index.toString());
      } else {
        const parent = currentControl.parent;
        const index = this.findIndexInParent(parent, currentControl);
        path.unshift(index);
      }
      currentControl = currentControl.parent;
    }

    return path;
  }

  findIndexInParent(parent: FormGroup | FormArray, control: AbstractControl): string {
    const keys = Object.keys(parent.controls);
    for (let i = 0; i < keys.length; i++) {
      if (parent.controls[keys[i]] === control) {
        return keys[i];
      }
    }
    return '';
  }

  findIndexInFormArray(formArray: FormArray, control: AbstractControl): number {
    const index = formArray.controls.findIndex(c => c === control);
    return index >= 0 ? index : -1;
  }
  /** <------------------------------------------------------------------------------------------- Form control path **/
}

