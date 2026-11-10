import { NgModule } from '@angular/core';
import { ReadMoreComponent, ReadMoreTextComponent } from './read-more.component';
import {
  provideHttpClient,
  withRequestsMadeViaParent
} from "@angular/common/http";

/**
 * Compatibility wrapper for hosts that still import NgModules. The components are standalone, new code imports them
 * directly.
 */
@NgModule({
  imports: [
    ReadMoreComponent,
    ReadMoreTextComponent,
  ],
  exports: [
    ReadMoreComponent,
    ReadMoreTextComponent,
  ],
  providers: [provideHttpClient(withRequestsMadeViaParent())]
})

export class CatalogueUiReusableComponentsModule {
}
