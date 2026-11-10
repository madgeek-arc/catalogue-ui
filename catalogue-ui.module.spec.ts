import { Component, Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CatalogueUiModule } from './catalogue-ui.module';
import { CompareModule } from './pages/dynamic-form/compare-versions/compare.module';
import { DynamicFormModule } from './pages/dynamic-form/dynamic-form.module';
import { CatalogueUiSharedModule } from './shared/catalogue-ui-shared.module';
import { CatalogueUiReusableComponentsModule } from './shared/reusable-components/catalogue-ui-reusable-components.module';

/**
 * The components, the pipe and the directive of the library are standalone. The modules stay for hosts that still
 * import them, and nothing in this repository imports them any more, so only this spec notices when one stops
 * compiling or stops exporting what it promises.
 */
@Component({
  selector: 'app-host',
  imports: [CatalogueUiReusableComponentsModule, CatalogueUiSharedModule],
  template: `
    <read-more-text [text]="'Hello'"></read-more-text>
    <span id="unique">{{ (items | unique: 'id').length }}</span>
  `
})
class HostComponent {
  items = [{ id: 1 }, { id: 1 }, { id: 2 }];
}

describe('compatibility modules of catalogue-ui', () => {
  beforeEach(() => TestBed.configureTestingModule({ errorOnUnknownElements: true, errorOnUnknownProperties: true }));

  it('export the reusable components and the shared pipe to a host that imports them', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('read-more-text').textContent).toContain('Hello');
    expect(fixture.nativeElement.querySelector('#unique').textContent).toBe('2');
  });

  it('compile, with every export declared or imported by the module', () => {
    TestBed.configureTestingModule({
      imports: [CatalogueUiModule, DynamicFormModule, CompareModule, CatalogueUiSharedModule, CatalogueUiReusableComponentsModule]
    });

    expect(() => TestBed.inject(Injector)).not.toThrow();
  });
});
