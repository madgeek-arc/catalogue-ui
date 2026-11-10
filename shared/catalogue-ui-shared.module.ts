import { NgModule } from "@angular/core";
import { UniquePipe } from "./pipes/uniquePipe.pipe";
import { SortableDirective } from "./directives/sortable.directive";

/**
 * Compatibility wrapper for hosts that still import NgModules. The pipe and the directive are standalone, new code
 * imports them directly.
 */
@NgModule({
  imports: [
    UniquePipe,
    SortableDirective
  ],
  exports: [
    UniquePipe,
    SortableDirective
  ]
})

export class CatalogueUiSharedModule { }
