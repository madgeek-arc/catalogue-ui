import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, UntypedFormGroup } from '@angular/forms';
import { APP_ENV } from '../../../../config/app-env.token';
import { Field, FieldType } from '../../../../domain/dynamic-form-model';
import { FormControlService } from '../../../../services/form-control.service';
import { ChooseOneComponent } from './choose-one.component';

function field(name: string, type: FieldType, subFields: Field[] = []): Field {
  const result = new Field(name, type);
  result.label.text = name;
  result.subFields = subFields;
  return result;
}

/**
 * A choose-one whose first option is a composite that holds another choose-one. The composite and the choose-one
 * component import each other (through forwardRef), so rendering the nesting needs both edges of that cycle to resolve.
 */
const nested = field('nested', FieldType.chooseOne, [field('leaf', FieldType.string), field('other', FieldType.string)]);
const outer = field('outer', FieldType.chooseOne, [field('group', FieldType.composite, [nested]), field('plain', FieldType.string)]);

@Component({
  selector: 'app-host',
  imports: [ReactiveFormsModule, ChooseOneComponent],
  template: `
    <form [formGroup]="form">
      <app-choose-one [fieldData]="outer"></app-choose-one>
    </form>
  `
})
class HostComponent {
  outer = outer;
  form = new UntypedFormGroup({ outer: inject(FormControlService).createCompositeField(outer) });
}

describe('ChooseOneComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      errorOnUnknownElements: true,
      errorOnUnknownProperties: true,
      providers: [{ provide: APP_ENV, useValue: { API_ENDPOINT: '/api', WS_ENDPOINT: '/api/websocket', production: false, beta: false } }]
    });
  });

  it('renders a composite option that holds another choose-one', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelectorAll('app-choose-one').length).toBe(2);
    expect(element.querySelectorAll('app-composite-field').length).toBe(1);
    expect(element.querySelector('app-choose-one app-composite-field app-choose-one')).not.toBeNull();
  });
});
