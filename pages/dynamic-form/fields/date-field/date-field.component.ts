import { Component, EventEmitter, OnInit, Output } from "@angular/core";
import { Field, HandleBitSet } from "../../../../domain/dynamic-form-model";
import { ReactiveFormsModule } from "@angular/forms";
import { DatePipe, NgIf } from "@angular/common";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { provideNativeDateAdapter } from '@angular/material/core';
import { BaseFieldHtmlComponent } from "../utils/base-field-html.component";
import { BaseFieldComponent } from "../utils/base-field.component";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
  selector: 'app-date-field',
  templateUrl: 'date-field.component.html',
  imports: [
    MatDatepickerModule,
    BaseFieldHtmlComponent,
    DatePipe,
    NgIf,
    ReactiveFormsModule
  ],
  providers: [
    provideNativeDateAdapter(),
  ],
})

export class DateFieldComponent extends BaseFieldComponent implements OnInit {

  @Output() handleBitSets = new EventEmitter<Field>();
  @Output() handleBitSetsOfComposite = new EventEmitter<HandleBitSet>();

  selectedDate: Date;

  ngOnInit() {
    super.ngOnInit();
    this.formControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value: Date | string | null) => {
      this.selectedDate = value ? new Date(value) : null;
    });
    this.selectedDate = this.formControl.getRawValue() ? new Date(this.formControl.getRawValue()) : null;
    // If formControl initially has a Date, normalize it too
  }



  dateChanged(event: Date) {
    if (this.fieldData.typeInfo.values?.[0] === 'formatDateToString') {
      this.formControl.setValue(event.toISOString().split('T')[0]);
      return;
    }
    this.formControl.setValue(event.getTime());
  }

  /** Bitsets--> **/

  updateBitSet(fieldData: Field) {
    this.timeOut(200).then(() => { // Needed for radio buttons strange behaviour
      if (fieldData.form.mandatory) {
        this.handleBitSets.emit(fieldData);
      }
    });
  }

}
