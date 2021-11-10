import {NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import {FormBuilderComponent} from "./form-builder.component";
import {NgSelectModule} from "@ng-select/ng-select";
import {FormsModule} from "@angular/forms";
import {GroupSectionComponent} from "./group-section/group-section.component";
import {FieldSectionComponent} from "./field-section/field-section.component";

@NgModule({
  declarations: [
    FormBuilderComponent,
    GroupSectionComponent,
    FieldSectionComponent
  ],
  imports: [
    CommonModule,
    NgSelectModule,
    FormsModule,
  ],
})

export class FormBuilderModule {}
