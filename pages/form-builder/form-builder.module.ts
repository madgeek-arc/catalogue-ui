import {NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import {FormBuilderComponent} from "./form-builder.component";
import {NgSelectModule} from "@ng-select/ng-select";
import {FormsModule} from "@angular/forms";

@NgModule({
  declarations: [
    FormBuilderComponent
  ],
  imports: [
    CommonModule,
    NgSelectModule,
    FormsModule,
  ],
})

export class FormBuilderModule {}
