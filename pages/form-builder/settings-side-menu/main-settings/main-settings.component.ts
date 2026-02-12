import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { FormBuilderService } from "../../../../services/form-builder.service";

@Component({
  selector: 'app-main-settings',
  templateUrl: './main-settings.component.html',
  imports: [
    FormsModule
  ]
})

export class MainSettingsComponent {
  protected fbService = inject(FormBuilderService);
}
