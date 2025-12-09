import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CommentAnchorService {
  private _positions = new Map<string, number>();
  private _positions$ = new BehaviorSubject<Map<string, number>>(this._positions);

  private _heights = new Map<string, number>();
  private _heights$ = new BehaviorSubject<Map<string, number>>(new Map());

  positions$ = this._positions$.asObservable();
  heights$ = this._heights$.asObservable();

  updatePosition(id: string, top: number, arrayPosition: number) {
    if (arrayPosition && arrayPosition > 0) { // ignore the all array elements beyond the first one.
      return;
    }

    this._positions.set(id, top);
    // emit a new Map so OnPush components see a new reference
    // console.log(this._positions);
    this._positions$.next(new Map(this._positions));
  }

  getPosition(id: string): number | undefined {
    return this._positions.get(id);
  }

  updateCommentHeight(commentId: string, height: number) {
    this._heights.set(commentId, height);
    this._heights$.next(new Map(this._heights));
  }

  getCommentHeight(commentId: string): number | undefined {
    return this._heights.get(commentId);
  }

  removeComment(commentId: string) {
    if (this._heights.delete(commentId)) {
      this._heights$.next(new Map(this._heights));
    }
  }

}
