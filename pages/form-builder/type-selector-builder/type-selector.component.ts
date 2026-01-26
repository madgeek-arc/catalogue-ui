import {
  Component,
  Input,
  OnChanges, OnInit,
  SimpleChanges
} from "@angular/core";
import { IdLabel, TypeInfo } from "../../../domain/dynamic-form-model";


@Component({
    selector: 'app-type-selector',
    templateUrl: 'type-selector.component.html',
    standalone: false
})

export class TypeSelectorComponent {

  @Input() typeInfo: TypeInfo;

  addOption() {
    const opt = new IdLabel();
    // FixMe: With proper values.
    opt.label = 'Option '+ (this.typeInfo.values.length+1);
    opt.id = 'Option '+ (this.typeInfo.values.length+1);
    this.typeInfo.values.push(opt);
  }

  remove(position) {
    this.typeInfo.values.splice(position, 1);
  }

  trackBy(index, item) {
    return index;
  }

}
