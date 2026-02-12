import { AfterViewInit, Component, inject } from "@angular/core";
import { JsonPipe, NgClass } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Field } from "../../domain/dynamic-form-model";
import { FormControlService } from "../../services/form-control.service";
import { IdGenerationService } from "../../services/id-generation.service";
import { FormBuilderService } from "../../services/form-builder.service";
import { SideMenuComponent } from "./side-menu/side-menu.component";
import { MainInfoComponent } from "./main-info/main-info.component";
import { FieldTemplatesComponent } from "./field-templates/field-templates.component";
import { SettingsSideMenuComponent } from "./settings-side-menu/settings-side-menu.component";
import * as UIkit from 'uikit';

@Component({
  selector: 'app-form-builder',
  templateUrl: 'form-builder.component.html',
  styleUrls: ['form-builder.component.scss'],
  providers: [FormControlService],
  imports: [
    NgClass,
    FormsModule,
    JsonPipe,
    SideMenuComponent,
    MainInfoComponent,
    FieldTemplatesComponent,
    SettingsSideMenuComponent
  ]
})

export class FormBuilderComponent implements AfterViewInit {
  private idService = inject(IdGenerationService);
  protected fbService = inject(FormBuilderService);

  ngAfterViewInit() {
    UIkit.modal('#fb-modal-full').show();
    this.idService.findMaxId(this.fbService.model());
  }

  fieldSelection(field: Field) { this.fbService.fieldSelection(field); }
  deleteField(i: number, parentField?: Field) { this.fbService.deleteField(i, parentField); }
  duplicateField(f: Field, parentField?: Field) { this.fbService.duplicateField(f, parentField); }
  move(a: number, b: number, parentField?: Field) { this.fbService.move(a, b, parentField); }
  updateReference(): void { this.fbService.updateReference(); }

}
