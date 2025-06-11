import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { TimelineService } from '../timeline.service';
import { CommonModule } from '@angular/common';
import { select } from 'd3-selection';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { DatePipe } from '@angular/common';
import * as d3 from 'd3'


interface TimelineEvent {
  id?: string;
  title: string;
  description?: string;
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
    MatCardModule,
    DatePipe
  ],
  templateUrl: './timeline.html',
  styleUrl: './timeline.css',
  providers: [TimelineService]
})
export class TimelineComponent implements OnInit, OnDestroy, AfterViewInit {


  newEntryDescription: string = '';
  // Initialize newEntryTitle as string to match the required type in the interface eventually
  // For now keep as string | null to align with input binding
  newEntryTitle: string | null = '';
  selectedEntry: TimelineEvent | null = null;
  newEntryDate: Date | null = null;
  newEntryEndDate: Date | null = null;
  timelineEvents: TimelineEvent[] = [];

  @ViewChild('d3TimelineContainer', { static: true }) d3TimelineContainer!: ElementRef;

  constructor(private timelineService: TimelineService) { }

  ngOnInit(): void {
    // Keep only data fetching and assignment here
    this.timelineService.getTimelineEvents().subscribe((events) => {
      console.log('Events from service:', events);
      // Map Firestore Timestamps to JavaScript Dates
      this.timelineEvents = events.map(event => ({
        ...event,
        date: event.date && typeof event.date.toDate === 'function' ? event.date.toDate() : (event.date ? new Date(event.date) : null),
        endDate: event.endDate && typeof event.endDate.toDate === 'function' ? event.endDate.toDate() : (event.endDate ? new Date(event.endDate) : null)

      }));
      console.log('Timeline Events fetched and mapped:', this.timelineEvents);
      // Call renderTimelineD3 after data is loaded and mapped, if container is available
      // Wrap in setTimeout to ensure DOM is ready for clientHeight calculation
      if (this.d3TimelineContainer) {
        setTimeout(() => {
          this.renderTimelineD3();
        }, 0);
      }
    }); // Corrected: Closing parenthesis and comma
  }

  ngAfterViewInit() {
    console.log('D3 Container Client Height:', this.d3TimelineContainer.nativeElement.clientHeight);
    console.log('ngAfterViewInit: timeline Events:', this.timelineEvents)
    this.renderTimelineD3();

  }

  ngOnDestroy() {
    if (this.d3TimelineContainer) {
      this.d3TimelineContainer.nativeElement.innerHTML = '';
    }
  }

  onSubmit() {
    console.log(this.selectedEntry);
    if (this.selectedEntry) {
      // Editing existing entry
      if (this.newEntryDate) {
        const updatedEntry: any = { // Use 'any' temporarily if strict typing is an issue here
          title: this.newEntryTitle as string, // Add type assertion
          description: this.newEntryDescription,
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
        const newEntry: any = { // Use 'any' temporarily if strict typing is an issue here
          description: this.newEntryDescription || undefined, // Handle optional description
          title: this.newEntryTitle,
          date: this.newEntryDate as Date, // Keep assertion for addDoc
          endDate: this.newEntryEndDate,
        };
        // Consider handling the promise returned by addTimelineEntry
        this.timelineService.addTimelineEntry(newEntry).then(() => this.clearForm());
      } else if (!this.newEntryTitle) {
        alert('Please enter a title for the timeline entry.');
      } else {
        alert('Please select a date for the timeline entry.');
      }
    }
    // Clear form fields after submission (both add and update)
    this.clearForm();
  }

  clearForm(): void {
    this.newEntryTitle = '';
    this.newEntryDescription = '';
    this.newEntryDate = null;
    this.newEntryEndDate = null;
  }

  selectEntry(event: TimelineEvent): void {
    this.newEntryTitle = event.title || '';
    this.newEntryDescription = event.description || '';
    this.newEntryDate = event.date; // Assuming event.date is a valid Date object when editing
    this.newEntryEndDate = event.endDate || null;
    this.selectedEntry = event;
  }

  private renderTimelineD3(): void {

    const container = this.d3TimelineContainer.nativeElement;

    select(container).select('svg').remove();

    const chart = d3.timeline();

    // Transform your timelineEvents data into the format expected by d3-timeline
    const transformedData = this.timelineEvents.map(event => {
      const times = [];
      if (event.date) {
        times.push({
          starting_time: event.date.getTime(), // Convert Date to milliseconds timestamp
          display: event.endDate ? 'rect' : 'circle', // Determine display based on endDate
          ending_time: event.endDate ? event.endDate.getTime() : undefined, // Include ending_time if it exists
          label: event.title // Use title as label
        });
      }
      return { times: times };
    });

    console.log('Transformed data for d3-timeline:', transformedData);


    select(container).datum(transformedData).call(chart);

    // Consider adding axes here later
    // For now, focus on seeing the data points

    // Remove temporary console logs after successful rendering
    // console.log(...)
  }
}
