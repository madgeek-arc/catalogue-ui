import { ChangeDetectionStrategy, Component, inject, Input, OnInit } from "@angular/core";
import {Field} from "../../../../domain/dynamic-form-model";
import { UntypedFormGroup, FormGroupDirective, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { NgClass } from "@angular/common";

@Component({
    selector: 'app-radio-grid',
    templateUrl: './radio-grid-field.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, ReactiveFormsModule, NgClass]
})

export class RadioGridFieldComponent implements OnInit {
  @Input() fieldData: Field;

  form!: UntypedFormGroup;
  hideField: boolean = null;


  private rootFormGroup = inject(FormGroupDirective);

  ngOnInit() {
    this.form = this.rootFormGroup.control;
    // console.log(this.form)
  }
}
