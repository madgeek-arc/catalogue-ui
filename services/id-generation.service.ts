import { Injectable } from "@angular/core";
import { Model } from "../domain/dynamic-form-model";
import { findMaxId } from "../shared/utils/utils";

@Injectable({ providedIn: 'root' })

export class IdGenerationService {
  private currentId = 0;

  findMaxId(model: Model) {
    this.currentId = findMaxId(model);
    console.log(this.currentId);
  }

  generateId(): number {
    return ++this.currentId;
  }

  reset(): void {
    this.currentId = 0;
  }
}
