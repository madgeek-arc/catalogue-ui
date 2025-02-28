import { NgModule } from "@angular/core";
import { SafeUrlPipe } from "./pipes/safeUrlPipe";
import { UniquePipe } from "./pipes/uniquePipe.pipe";
import { SortableDirective } from "./directives/sortable.directive";

@NgModule({
  declarations: [
    SafeUrlPipe,
    UniquePipe,
    SortableDirective
  ],
  imports: [],
  exports: [
    SafeUrlPipe,
    UniquePipe,
    SortableDirective
  ]
})

export class CatalogueUiSharedModule { }
