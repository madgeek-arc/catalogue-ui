import { Component, inject } from "@angular/core";
import { BaseFieldComponent } from "../../utils/base-field.component";
import { ReactiveFormsModule } from "@angular/forms";
import { BaseFieldHtmlComponent } from "../../utils/base-field-html.component";
import { NgSelectComponent } from "@ng-select/ng-select";
import { VocabularyService } from "../../../../../services/vocabulary.service";
import { VocabularyProperties } from "../../../../../domain/dynamic-form-model";

@Component({
  selector: 'app-vocabulary-field',
  templateUrl: './vocabulary-field.component.html',
  styleUrls: ['./vocabulary-field.component.less'],
  imports: [
    ReactiveFormsModule,
    BaseFieldHtmlComponent,
    NgSelectComponent
  ]
})

export class VocabularyFieldComponent extends BaseFieldComponent {
  private vocabularyService = inject(VocabularyService);

  dynamicVoc: object[] = [];
  voc: object[] = [];
  properties?: VocabularyProperties;

  ngOnInit() {
    super.ngOnInit();
    this.properties = this.fieldData.typeInfo.properties as VocabularyProperties;
    this.vocabularyService.getVoc(this.properties.url).subscribe({
      next: (voc) => {
        this.voc = voc;
        if (!this.fieldData.form.dependsOn)
          this.dynamicVoc = voc;
      },
      error: (err) => {
        console.error(err);
      },
    });
  }

  enableDisableField(value: string) {
    this.dynamicVoc = [];

    if (this.fieldData.form.dependsOn.value) {
      if (value === this.fieldData.form.dependsOn.value) {
        this.formControl.enable();
      } else {
        this.formControl.disable();
        this.formControl.reset();
      }
    } else if (value) {
      this.dynamicVoc = this.voc.filter(v => v['parentId'] === value);
      // console.log(this.voc);
      // console.log(this.dynamicVoc);
      this.formControl.reset(null);
      this.formControl.enable();
    } else {
      this.formControl.disable();
      this.formControl.reset();
    }
  }

}
