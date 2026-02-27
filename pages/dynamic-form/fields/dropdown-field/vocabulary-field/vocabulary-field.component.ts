import { Component, inject } from "@angular/core";
import { BaseFieldComponent } from "../../utils/base-field.component";
import {ReactiveFormsModule, UntypedFormControl, UntypedFormGroup} from "@angular/forms";
import { BaseFieldHtmlComponent } from "../../utils/base-field-html.component";
import { NgSelectComponent } from "@ng-select/ng-select";
import { VocabularyService } from "../../../../../services/vocabulary.service";
import { VocabularyProperties } from "../../../../../domain/dynamic-form-model";
import { NgClass } from "@angular/common";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";

@Component({
  selector: 'app-vocabulary-field',
  templateUrl: './vocabulary-field.component.html',
  styleUrls: ['./vocabulary-field.component.less'],
  imports: [
    ReactiveFormsModule,
    BaseFieldHtmlComponent,
    NgSelectComponent,
    NgClass
  ]
})

export class VocabularyFieldComponent extends BaseFieldComponent {
  private vocabularyService = inject(VocabularyService);

  voc: object[] = [];
  properties?: VocabularyProperties;

  ngOnInit() {
    this.properties = this.fieldData.typeInfo.properties as VocabularyProperties;

    if (this.position !== null) {
      this.form = this.rootFormGroup.control.controls[this.position] as UntypedFormGroup;
    } else {
      this.form = this.rootFormGroup.control;
    }
    // console.log(this.form);
    this.formControl = this.form.get(this.fieldData.name) as UntypedFormControl;
    this.inputId = this.getPath(this.formControl).join('.');

    if (this.fieldData.form.dependsOn) {
      // console.log(this.fieldData.form.dependsOn);
      this.enableDisableVocabularyField(this.form.get(this.fieldData.form.dependsOn.name).value, false);

      this.form.get(this.fieldData.form.dependsOn.name).valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(
        value => {
          this.enableDisableVocabularyField(value);
        },
        error => {console.error(error)}
      );
    } else {
      this.setVocabulary();
    }
  }

  setVocabulary() {
    if (this.properties?.urlParams && this.properties.urlParams.length > 0) {
      let url = this.properties.url;

      let paramValueNotFound = false;
      // Loop through each urlParam to replace placeholders
      this.properties.urlParams.forEach((param) => {
        const value = this.form.get(param.valueFromField).value;
        if (value != null) {
          url = url.replace(param.placeholder, value);
        } else {
          paramValueNotFound = true;
        }
      });

      if (!paramValueNotFound) {
        this.getVocabulary(url);
      }

    } else {
      this.getVocabulary(this.properties.url);
    }
  }

  getVocabulary(url: string) {
    this.vocabularyService.getVoc(url).subscribe({
      next: (voc) => {
        this.voc = voc;
      },
      error: (err) => {
        console.error(err);
      },
    });
  }

  enableDisableVocabularyField(value: string, resetValue: boolean = true) {
    this.voc = [];

    if (this.fieldData.form.dependsOn.value) {
      if (value === this.fieldData.form.dependsOn.value) {
        this.formControl.enable();
        this.setVocabulary();
      } else {
        this.formControl.disable();
        this.formControl.reset();
      }
    } else if (value) {
      // this.dynamicVoc = this.voc.filter(v => v['parentId'] === value);
      this.setVocabulary();
      // console.log(this.voc);
      // console.log(this.dynamicVoc);
      if (resetValue) {
        this.formControl.reset(null);
      }
      this.formControl.enable();
    } else {
      this.formControl.disable();
      this.formControl.reset();
    }
  }

}
