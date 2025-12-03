// comment-anchor.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface AnchorPosition {
  id: string;
  top: number; // px from top of the container
}

@Injectable({ providedIn: 'root' })
export class CommentAnchorService {
  private _positions = new Map<string, number>();
  private _positions$ = new BehaviorSubject<Map<string, number>>(this._positions);

  positions$ = this._positions$.asObservable();

  updatePosition(id: string, top: number) {
    this._positions.set(id, top);
    // emit a new Map so OnPush components see a new reference
    this._positions$.next(new Map(this._positions));
  }

  getPosition(id: string): number | undefined {
    return this._positions.get(id);
  }
}
