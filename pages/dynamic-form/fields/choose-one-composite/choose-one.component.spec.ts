import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, UntypedFormArray, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { APP_ENV } from '../../../../config/app-env.token';
import { Field, FieldType } from '../../../../domain/dynamic-form-model';
import { FormControlService } from '../../../../services/form-control.service';
import { WebsocketService } from '../../../../services/websocket.service';
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

const repeated = field('repeated', FieldType.chooseOne, [field('plain', FieldType.string)]);
repeated.typeInfo.multiplicity = true;

@Component({
  selector: 'app-repeated-host',
  imports: [ReactiveFormsModule, ChooseOneComponent],
  template: `
    <form [formGroup]="form">
      <app-choose-one [fieldData]="repeated" [editMode]="true"></app-choose-one>
    </form>
  `
})
class RepeatedHostComponent {
  repeated = repeated;
  form = new UntypedFormGroup({
    repeated: new UntypedFormArray(['a', 'b', 'c'].map(value => new UntypedFormGroup({ plain: new UntypedFormControl(value) })))
  });
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

  it('removes an element silently and sends a DELETE for its path', () => {
    const wsEdit = vi.spyOn(TestBed.inject(WebsocketService), 'WsEdit').mockImplementation(() => undefined);
    const fixture = TestBed.createComponent(RepeatedHostComponent);
    fixture.detectChanges();
    const array = fixture.componentInstance.form.get('repeated') as UntypedFormArray;
    const valueChanges = vi.fn();
    fixture.componentInstance.form.valueChanges.subscribe(valueChanges);
    const chooseOne = fixture.debugElement.query(debug => debug.componentInstance instanceof ChooseOneComponent)
      .componentInstance as ChooseOneComponent;

    chooseOne.remove(1);

    expect(array.value).toEqual([{ plain: null }, { plain: 'c' }]);
    expect(valueChanges).not.toHaveBeenCalled();
    expect(wsEdit).toHaveBeenCalledExactlyOnceWith({
      field: 'repeated.[1]',
      value: null,
      action: { type: 'DELETE', index: 1 }
    });
  });
});
