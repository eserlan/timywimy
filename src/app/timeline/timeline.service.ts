import { inject, NgZone } from '@angular/core';
import { Firestore, collection, collectionData, DocumentData, Query } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export class TimelineService {

  firestore: Firestore = inject(Firestore);
  private ngZone: NgZone = inject(NgZone);

  getTimelineEvents(): Observable<any[]> {
    const eventsCollection = collection(this.firestore, 'events');
    return this.ngZone.run(() => {
      return collectionData(eventsCollection) as Observable<any[]>;
    });
  }
}