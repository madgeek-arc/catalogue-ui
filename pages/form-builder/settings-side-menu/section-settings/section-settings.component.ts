import { Component, inject, ChangeDetectionStrategy } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { FormBuilderService, refreshOnBuilderEdits } from "../../../../services/form-builder.service";
import { RichTextEditorComponent } from "../../../../shared/reusable-components/rich-text-editor/rich-text-editor.component";

@Component({
  selector: 'app-section-settings',
  standalone: true,
  templateUrl: './section-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RichTextEditorComponent,
    FormsModule
  ]
})

export class SectionSettingsComponent {
  protected fbService = inject(FormBuilderService);

  constructor() {
    refreshOnBuilderEdits();
  }
}
