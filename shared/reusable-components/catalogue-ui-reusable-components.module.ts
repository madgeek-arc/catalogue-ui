import { NgModule } from '@angular/core';
import { ReadMoreComponent, ReadMoreTextComponent } from './read-more.component';

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
  ]
})

export class CatalogueUiReusableComponentsModule {
}
