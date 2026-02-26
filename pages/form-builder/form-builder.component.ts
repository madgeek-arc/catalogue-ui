import { Component, DestroyRef, inject, OnInit, signal } from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { JsonPipe, NgClass } from "@angular/common";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { filter, map, switchMap, tap } from "rxjs/operators";
import { Field, Model } from "../../domain/dynamic-form-model";
import { DynamicCatalogueService } from "../../services/dynamic-catalogue.service";
import { FormControlService } from "../../services/form-control.service";
import { FormBuilderService } from "../../services/form-builder.service";
import { FileDownloadService } from "../../services/file-download.service";
import { SettingsSideMenuComponent } from "./settings-side-menu/settings-side-menu.component";
import { FieldTemplatesComponent } from "./field-templates/field-templates.component";
import { SideMenuComponent } from "./side-menu/side-menu.component";
import { MainInfoComponent } from "./main-info/main-info.component";
import { DynamicFormModule } from "../dynamic-form/dynamic-form.module";
import UIkit from "uikit";
import { WebsocketService } from "../../../app/services/websocket.service";

@Component({
  selector: 'app-form-builder',
  templateUrl: 'form-builder.component.html',
  styleUrls: ['form-builder.component.less'],
  providers: [WebsocketService],
  imports: [
    NgClass,
    FormsModule,
    SideMenuComponent,
    MainInfoComponent,
    FieldTemplatesComponent,
    SettingsSideMenuComponent,
    RouterLink,
    JsonPipe,
    DynamicFormModule
  ]
})

export class FormBuilderComponent implements OnInit {
  private destroyRef = inject(DestroyRef)
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private wsService = inject(WebsocketService);
  private catalogueService = inject(DynamicCatalogueService);
  private fileDownloadService = inject(FileDownloadService);
  protected fbService = inject(FormBuilderService);

  loading = signal(false);
  error = signal<string | null>(null);

  editMode = false;

  ngOnInit() {
    if (this.route.snapshot.routeConfig?.path === 'fb/new-form') {
      this.fbService.setModel();
      this.editMode = false;
    } else {
      this.editMode = true;
      if (!this.fbService.model()) {
        this.route.params.pipe(
          map(params => params['id']),
          filter(Boolean),
          tap(() => this.loading.set(true)),
          switchMap((id: string) => this.catalogueService.getFormModel(id)),
          takeUntilDestroyed(this.destroyRef)
        ).subscribe({
          next: (model) => {
            this.initModel(model);
            this.loading.set(false);
          },
          error: (err) => {
            this.error.set('Failed to load model: ' + err.message + '');
            this.loading.set(false);
          }
        });
      }
    }
  }

  initModel(model: Model) {
    this.fbService.setModel(model);
  }

  saveModel() {
    this.catalogueService.postFormModel(this.fbService.model(), this.editMode).subscribe({
      next: () => {
        this.router.navigate(['/fb']).then();
      },
      error: (err) => {
        this.error.set('Failed to save model: ' + err.message + '');
      }
    });
  }

  fieldSelection(field: Field) { this.fbService.fieldSelection(field); }
  deleteField(i: number, parentField?: Field) { this.fbService.deleteField(i, parentField); }
  duplicateField(f: Field, parentField?: Field) { this.fbService.duplicateField(f, parentField); }
  move(a: number, b: number, parentField?: Field) { this.fbService.move(a, b, parentField); }

  // Modal
  hideModal(id: string) {
    UIkit.modal(document.getElementById(id)).hide();
  }

  downloadJson() {
    this.fileDownloadService.downloadJson(this.fbService.model());
  }
}
