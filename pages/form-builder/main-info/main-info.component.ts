import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { FormBuilderService } from "../../../services/form-builder.service";
import { RichTextEditorComponent } from "../../../shared/reusable-components/rich-text-editor/rich-text-editor.component";

@Component({
  selector: 'app-main-info',
  standalone: true,
  templateUrl: './main-info.component.html',
  imports: [
    RichTextEditorComponent,
    FormsModule
  ]
})

export class MainInfoComponent {
  protected fbService = inject(FormBuilderService);
}
