import { UntypedFormArray, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { controlPath } from './control-path';

describe('controlPath', () => {
  it('joins group keys and array positions from the form root', () => {
    const leaf = new UntypedFormControl('x');
    const items = new UntypedFormArray([
      new UntypedFormGroup({ name: new UntypedFormControl('a') }),
      new UntypedFormGroup({ name: leaf })
    ]);
    new UntypedFormGroup({ section: new UntypedFormGroup({ items }) });

    expect(controlPath(leaf)).toBe('section.items.[1].name');
    expect(controlPath(items.at(0))).toBe('section.items.[0]');
  });
});
