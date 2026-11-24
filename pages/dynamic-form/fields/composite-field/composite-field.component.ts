import { ChangeDetectorRef, Component, DestroyRef, EventEmitter, forwardRef, inject, Input, OnInit, Output, ChangeDetectionStrategy, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Field, HandleBitSet } from "../../../../domain/dynamic-form-model";
import {
  AbstractControl,
  FormArray,
  FormGroup,
  FormGroupDirective,
  FormsModule,
  ReactiveFormsModule,
  UntypedFormArray,
  UntypedFormGroup
} from "@angular/forms";
import { FormControlService } from "../../../../services/form-control.service";
import { WebsocketService } from "../../../../services/websocket.service";
import { BaseFieldHtmlComponent } from "../utils/base-field-html.component";
import { SortableDirective } from "../../../../shared/directives/sortable.directive";
import { NgClass } from "@angular/common";
import { ChooseOneComponent } from "../choose-one-composite/choose-one.component";
import { SelectFieldComponent } from "../dropdown-field/select-field/select-field.component";
import { VocabularyFieldComponent } from "../dropdown-field/vocabulary-field/vocabulary-field.component";
import { StringFieldComponent } from "../string-field/string-field.component";
import { NumberFieldComponent } from "../number-field/number-field.component";
import { BooleanFieldComponent } from "../boolean-field/boolean-field.component";
import { CheckboxFieldComponent } from "../checkbox-field/checkbox-field.component";
import { LargeTextFieldComponent } from "../large-text-field/large-text-field.component";
import { RadioButtonFieldComponent } from "../radio-button-field/radio-button-field.component";
import { RichTextFieldComponent } from "../rich-text-field/rich-text-field.component";
import { DateFieldComponent } from "../date-field/date-field.component";
import { ScaleFieldComponent } from "../scale-field/scale-field.component";

interface PositionChange {
  oldIndex: number;
  newIndex: number;
  element: HTMLElement;
}

@Component({
    selector: 'app-composite-field',
    templateUrl: './composite-field.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        FormsModule,
        ReactiveFormsModule,
        BaseFieldHtmlComponent,
        SortableDirective,
        NgClass,
        forwardRef(() => ChooseOneComponent),
        SelectFieldComponent,
        VocabularyFieldComponent,
        StringFieldComponent,
        NumberFieldComponent,
        BooleanFieldComponent,
        CheckboxFieldComponent,
        LargeTextFieldComponent,
        RadioButtonFieldComponent,
        RichTextFieldComponent,
        DateFieldComponent,
        ScaleFieldComponent
    ]
})

export class CompositeFieldComponent implements OnInit {
  private wsService = inject(WebsocketService);
  private rootFormGroup = inject(FormGroupDirective);
  private formService = inject(FormControlService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  @Input() fieldData: Field;
  @Input() vocabularies: Map<string, object[]>;
  @Input() subVocabularies: Map<string, object[]> = null;
  @Input() editMode: any;
  @Input() readonly: boolean = null;
  @Input() position?: number = null;
  @Input() scrollContainer: HTMLElement | null = null;

  @Output() hasChanges = new EventEmitter<boolean>();
  @Output() handleBitSets = new EventEmitter<Field>();
  @Output() handleBitSetsOfComposite = new EventEmitter<HandleBitSet>();

  form: UntypedFormGroup;
  hideField = signal<boolean | null>(null);
  inputId!: string;

  ngOnInit() {
    if (this.position !== null) {
      this.form = this.rootFormGroup.control.controls[this.position].get(this.fieldData.name) as UntypedFormGroup;
    } else {
      this.form = this.rootFormGroup.control.get(this.fieldData.name) as UntypedFormGroup;
    }

    // console.log(this.form);
    this.inputId = this.getPath(this.form).join('.');
    // The template reads the group's state (validity, dirty, array length), which also changes from outside this
    // component: validation, the read-only disable, other users' edits. Refresh on every event of the group.
    this.form.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.cdr.markForCheck());
    if(this.fieldData.form.dependsOn) { // specific changes for composite field, maybe revise it
      this.enableDisableField(this.rootFormGroup.form.get(this.fieldData.form.dependsOn.name).value);

      this.rootFormGroup.form.get(this.fieldData.form.dependsOn.name).valueChanges.subscribe(value => {
        this.enableDisableField(value);
      });
    }
  }

  /** Form control path -------------------------------------------------------------------------------------------> **/
  getPath(control: AbstractControl): string[] {
    const path: string[] = [];
    let currentControl: AbstractControl | null = control;

    // Traverse up the tree until reaching the root
    while (currentControl && currentControl.parent) {
      if (currentControl.parent instanceof FormArray) {
        const index = '['+this.findIndexInFormArray(currentControl.parent, currentControl)+']';
        path.unshift(index.toString());
      } else {
        const parent = currentControl.parent;
        const index = this.findIndexInParent(parent, currentControl);
        path.unshift(index);
      }
      currentControl = currentControl.parent;
      // console.log(path);
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

  /** Handle Arrays --> **/
  fieldAsFormArray() {
    return this.form as unknown as UntypedFormArray;
  }

  remove(i: number) {
    let path = this.getPath(this.form.controls[i]).join('.');
    console.log(path);
    this.fieldAsFormArray().removeAt(i, {emitEvent: false});
    if (this.editMode && this.form instanceof FormArray) {
      this.wsService.WsEdit({
        field: path,
        value: null,
        action: {type: 'DELETE', index: i}
      });
    }
  }

  pushComposite(compositeField: Field) {
    // console.log(path);
    this.fieldAsFormArray().push(this.formService.createCompositeField(compositeField), {emitEvent: false});
    if (this.editMode && this.form instanceof FormArray) {
      this.wsService.WsEdit({
        field: this.getPath(this.form.controls[this.fieldAsFormArray().length-1]).join('.'),
        value: this.form.controls[this.fieldAsFormArray().length-1].value,
        action: {type: 'ADD'}
      });
    }
  }

  /** <-- Handle Arrays **/

  /** Detect position change **/
  onPositionChanged(change: PositionChange): void {
    console.log(`Element ${change.element.id} moved from index ${change.oldIndex} to ${change.newIndex}`);
    this.move(change.newIndex, change.oldIndex)
  }

  move(newIndex: number, oldIndex: number) {
    const formArray = this.fieldAsFormArray();
    const currentGroup = formArray.at(oldIndex);
    const path = this.getPath(this.form.controls[oldIndex]).join('.');

    formArray.removeAt(oldIndex, {emitEvent: false});
    formArray.insert(newIndex, currentGroup, {emitEvent: false});

    if (this.editMode) {
      this.wsService.WsEdit({
        field: path,
        value: null,
        action: {type: 'MOVE', index: newIndex}
      });
    }
  }

  /** check form fields and tabs validity--> **/

  checkFormValidity(name: string, edit: boolean): boolean {
    return (!this.form.get(name).valid && (edit || this.form.get(name).dirty));
  }

  /** <-- check form fields and tabs validity **/

  /** Handle Bitsets--> **/

  updateBitSet(fieldData: Field) {
    this.timeOut(200).then(() => { // Needed for radio buttons strange behaviour
      if (fieldData.form.mandatory) {
        this.handleBitSets.emit(fieldData);
      }
    });
  }

  updateBitSetOfComposite(fieldData: Field, position: number) {
    if (fieldData.form.mandatory) {
      let tmp: HandleBitSet = {field: fieldData, position: position};
      // tmp.field = fieldData;
      // tmp.position = position;
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
    if (value === 'Applicable' || value === 'Yes') {
      this.form.enable();
      this.hideField.set(false);
      this.fieldData.form.display.visible = true;

    } else {
      this.form.disable();
      this.form.reset();
      this.hideField.set(true);
      this.fieldData.form.display.visible = false;
      // maybe add this if the remaining empty fields are a problem
      // (this.formControl as unknown as FormArray).clear();

    }
  }
}
