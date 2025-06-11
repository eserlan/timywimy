import { inject } from '@angular/core';
import { Firestore, collection, collectionData, DocumentData, Query, addDoc, updateDoc, doc, orderBy, query } from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';

export class TimelineService {

  firestore: Firestore = inject(Firestore);

  getTimelineEvents(): Observable<any[]> {
    const eventsCollection = collection(this.firestore, 'events');
    const sortedQuery = query(eventsCollection, orderBy('date'));
    return collectionData(sortedQuery, { idField: 'id' }) as Observable<any[]>;
  }

  updateTimelineEntry(entry: any, updatedData: { description?: string | null; date: Date | null; endDate?: Date | null; title: string }) {
    console.log(entry);
    if (!entry.id) {
      return Promise.reject('Entry does not have an ID for updating.');
    }
    const entryDocRef = doc(this.firestore, 'events', entry.id);

    const updatePayload: any = {
      description: updatedData.description,
      date: updatedData.date,
      title: updatedData.title
    };
    if (updatedData.endDate !== undefined) {
      updatePayload.endDate = updatedData.endDate;
    }
    return updateDoc(entryDocRef, updatePayload);
  }

  addTimelineEntry(entry: { description?: string | null; date: Date | null; endDate?: Date | null; title: string }) {
    const eventsCollection = collection(this.firestore, 'events');
    return addDoc(eventsCollection, entry);
  }
}