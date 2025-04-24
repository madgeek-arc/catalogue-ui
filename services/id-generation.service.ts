import { Injectable } from "@angular/core";
import { Model } from "../domain/dynamic-form-model";

@Injectable({ providedIn: 'root' })
export class IdGenerationService {
  private currentId = 0;

  findMaxId(model: Model) {
    this.currentId = model.maxId;
  }

  generateId(): number {
    return ++this.currentId;
  }

  reset(): void {
    this.currentId = 0;
  }
}
