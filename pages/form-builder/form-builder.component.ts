import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ViewChild
} from "@angular/core";
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
import Modal = UIkit.Modal;
import UIkitModalElement = UIkit.UIkitModalElement;

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

export class FormBuilderComponent implements OnInit, AfterViewInit, OnDestroy {
  private destroyRef = inject(DestroyRef)
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private catalogueService = inject(DynamicCatalogueService);
  private fileDownloadService = inject(FileDownloadService);
  protected fbService = inject(FormBuilderService);

  @ViewChild('modalPreview') formPreviewModalElement!: ElementRef;
  @ViewChild('modalJson') jsonModalElement!: ElementRef;

  loading = signal(false);
  error = signal<string | null>(null);

  editMode = false;
  jsonModal: UIkitModalElement;
  formPreviewModal: UIkitModalElement;
  showPreview = signal(false);

  ngAfterViewInit(): void {
    const element = this.formPreviewModalElement.nativeElement;

    // Create UIkit modal instances
    this.formPreviewModal = UIkit.modal(element);
    this.jsonModal = UIkit.modal(this.jsonModalElement.nativeElement);

    element.addEventListener('beforeshow', this.onBeforeShow);
    element.addEventListener('hidden', this.onHidden);
  }

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

  ngOnDestroy(): void {
    const formModal = this.formPreviewModalElement?.nativeElement;
    if (formModal) {
      formModal.removeEventListener('beforeshow', this.onBeforeShow);
      formModal.removeEventListener('hidden', this.onHidden);
    }
    if (this.formPreviewModal) {
      try {
        this.formPreviewModal.hide();
        this.formPreviewModal.$destroy(true); // also removes the element from the DOM.
      } catch {}
    }

    if (this.jsonModal) {
      try {
        this.jsonModal.hide();
        this.jsonModal.$destroy(true); // also removes the element from the DOM.
      } catch {}
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

  onBeforeShow = (event: any) => {
    if (event.target === this.formPreviewModalElement.nativeElement) {
      this.showPreview.set(true);
    }
  };

  onHidden = (event: any) => {
    if (event.target === this.formPreviewModalElement.nativeElement) {
      this.showPreview.set(false);
    }
  };

  // Other
  downloadJson() {
    this.fileDownloadService.downloadJson(this.fbService.model());
  }
}
