import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReadMoreComponent, ReadMoreTextComponent } from './read-more.component';
import { provideHttpClient, withInterceptorsFromDi, withJsonpSupport } from "@angular/common/http";

@NgModule({
  declarations: [
    ReadMoreComponent,
    ReadMoreTextComponent,
  ],
  exports: [
    ReadMoreComponent,
    ReadMoreTextComponent,
  ],
  imports: [CommonModule],
  providers: [provideHttpClient(withInterceptorsFromDi(), withJsonpSupport())]
})

export class CatalogueUiReusableComponentsModule {
}
