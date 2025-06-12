import { Component, OnInit } from '@angular/core';
import { TimelineService } from '../timeline.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

interface TimelineEvent {
  id?: string;
  title: string;
  description?: string | null;
  date: Date | null;
  endDate?: Date | null;
}

@Component({
  selector: 'app-timeline',
  standalone: true, // Assuming standalone component based on your imports
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatCardModule
  ],
  templateUrl: './timeline.html',
  styleUrl: './timeline.css',
  providers: [TimelineService]
})
export class TimelineComponent implements OnInit  {
  newEntryDescription: string = '';
  newEntryTitle: string = '';
  selectedEntry: TimelineEvent | null = null;
  newEntryDate: Date | null = null;
  newEntryEndDate: Date | null = null;
  timelineEvents: TimelineEvent[] = [];

  constructor(private timelineService: TimelineService) {}

  ngOnInit() {
    this.timelineService.getTimelineEvents().subscribe((events) => {
      this.timelineEvents = events.map(event => ({
        ...event,
        date: event.date && typeof event.date.toDate === 'function' ? event.date.toDate() : (event.date ? new Date(event.date) : null),
        endDate: event.endDate && typeof event.endDate.toDate === 'function' ? event.endDate.toDate() : (event.endDate ? new Date(event.endDate) : null)

      }));
      console.log('Timeline Events:', this.timelineEvents);
    });
  }

  onSubmit() {
    console.log(this.selectedEntry);
    if (this.selectedEntry) {
      // Editing existing entry
      if (this.newEntryDate) {
        const updatedEntry: TimelineEvent = {
          description: this.newEntryDescription,
          title: this.newEntryTitle,
          date: this.newEntryDate,
          endDate: this.newEntryEndDate,
        };
        // Pass the selectedEntry (with the id) and the updated data
        this.timelineService.updateTimelineEntry(this.selectedEntry, updatedEntry);

        this.selectedEntry = null; // Deselect after updating
      } else {
        alert('Please select a date for the timeline entry.');
      }
    } else {
      // Adding new entry
      if (this.newEntryTitle && this.newEntryDate) {
        const newEntry: TimelineEvent = {
          description: this.newEntryDescription,
          title: this.newEntryTitle,
          date: this.newEntryDate as Date, // Keep assertion for addDoc
          endDate: this.newEntryEndDate,
        };
        this.timelineService.addTimelineEntry(newEntry);
      } else if (!this.newEntryTitle) {
        alert('Please enter a title for the timeline entry.');
      } else {
        alert('Please select a date for the timeline entry.');
      }
    }
    // Clear form fields after submission (both add and update)
    this.newEntryTitle = '';
    this.newEntryDescription = '';
    this.newEntryDate = null;
    this.newEntryTitle = '';
    this.newEntryEndDate = null;
  }

  selectEntry(event: TimelineEvent): void {
    this.newEntryTitle = event.title || '';
    this.newEntryDescription = event.description || '';
    this.newEntryDate = event.date; // Assuming event.date is a valid Date object when editing
    this.newEntryEndDate = event.endDate || null;
    this.selectedEntry = event;
  }
}
