import { Component, inject, ChangeDetectionStrategy } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { FormBuilderService } from "../../../../services/form-builder.service";

@Component({
  selector: 'app-main-settings',
  standalone: true,
  templateUrl: './main-settings.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    FormsModule
  ]
})

export class MainSettingsComponent {
  protected fbService = inject(FormBuilderService);
}
