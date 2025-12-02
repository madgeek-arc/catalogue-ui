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
    this.formControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value: string | number | null) => {
      this.selectedDate = this.parseLocalDate(value);
    });
    // If formControl initially has a Date, normalize it too
    this.selectedDate = this.parseLocalDate(this.formControl.getRawValue());
  }

  dateChanged(event: Date) {
    if (this.fieldData.typeInfo.values?.[0] === 'formatDateToString') {
      this.formControl.setValue(this.formatDateLocal(event));
      return;
    }
    this.formControl.setValue(event.getTime());
  }

  formatDateLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }


  /**
   * Converts various date formats to a JavaScript Date object, avoiding timezone shift, handling different input types:
   * - Numeric timestamps (milliseconds since epoch)
   * - String timestamps
   * - Partial dates in YYYY-MM-DD format
   * - Other date string formats (ISO strings, etc.)
   *
   * @param value - The date value to parse, can be a string timestamp, numeric timestamp, or date string
   * @returns A Date object representing the parsed date, or null if the input is empty/invalid
   */
  parseLocalDate(value: string | number | null): Date | null {
    if (!value) return null;

    // 1. Handle numeric timestamps (e.g. 1735753200000)
    if (typeof value === 'number') {
      // This is interpreted correctly by JS Date. No timezone problem.
      return new Date(value);
    }

    // 2. Handle string numbers: "1735753200000"
    if (/^\d+$/.test(value)) {
      return new Date(Number(value));
    }

    // strip time from ISO strings to handle partial date values
    if(value.includes('T')){
      value = value.split('T')[0];
    }
    // 3. Handle partial date: "YYYY-MM-DD"
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split('-').map(Number);
      // Local date, avoids timezone conversion
      return new Date(year, month - 1, day);
    }

    // 4. Fallback (ISO strings, other formats) is
    // Not ideal for partial dates but works for full ISO timestamps
    return new Date(value);
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
