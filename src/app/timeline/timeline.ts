import {Component, OnInit, ChangeDetectorRef} from '@angular/core';
import {TimelineService} from '../timeline.service';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatNativeDateModule} from '@angular/material/core';
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import {MatProgressBarModule} from '@angular/material/progress-bar';

import {NgxEchartsModule} from 'ngx-echarts';
import {EChartsOption} from 'echarts';
import type {EChartsType} from 'echarts/types/dist/shared';

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
    MatButtonModule,
    MatCardModule,
    MatProgressBarModule,
    NgxEchartsModule
  ],
  templateUrl: './timeline.html',
  styleUrl: './timeline.css',
  providers: [TimelineService]

})
export class TimelineComponent implements OnInit {

  formData: TimelineEvent = {title: '', description: null, date: null, endDate: null}; // Use a single object for form data
  selectedEntry: TimelineEvent | null = null;

  loading = true;

  newEntryDate: Date | null = null;
  newEntryEndDate: Date | null = null;
  timelineEvents: TimelineEvent[] = [];
  private echartsInstance!: EChartsType; // Property to hold the ECharts instance
  chartOptions: EChartsOption = {};

  constructor(private timelineService: TimelineService, private cdr: ChangeDetectorRef) {
  }

  ngOnInit() {
    this.loading = true;

    this.timelineService.getTimelineEvents().subscribe((events) => {
      this.timelineEvents = events.map(event => ({
        ...event,
        date: event.date && typeof event.date.toDate === 'function' ? event.date.toDate() : (event.date ? new Date(event.date) : null),
        endDate: event.endDate && typeof event.endDate.toDate === 'function' ? event.endDate.toDate() : (event.endDate ? new Date(event.endDate) : null)
      }));
      console.log('Timeline Events:', this.timelineEvents);
      this.resetForm(); // Initialize form with empty data
      this.updateChartOptions();
      this.loading = false;
    });
  }

  updateChartOptions(): void {
    const periodScatterData: any[] = []; // Data for scatter points representing periods

    this.timelineEvents
      .filter(event => event.date && event.endDate)
      .forEach(event => {
        const startDate = event.date!.getTime();
        const endDate = event.endDate!.getTime();
        const dayDuration = 24 * 60 * 60 * 1000; // Milliseconds in a day
        for (let time = startDate; time <= endDate; time += dayDuration) {
          periodScatterData.push([time, event.title, event.id]);
        }
      });

    const singleScatterData = this.timelineEvents
      .filter(event => event.date && !event.endDate)
      .map(event => {
        return [
          event.date!.getTime(), // Date in milliseconds
          event.title,
          event.id // Include the event ID
        ];
      });

    this.chartOptions = {
      ...this.defaultChartOptions,
      tooltip: {
        ...this.defaultChartOptions.tooltip,
        formatter: this.formatTooltip.bind(this)
      },
      yAxis: {
        ...this.defaultChartOptions.yAxis,
        data: this.timelineEvents.map(event => event.title)
      },
      series: [
        { ...(Array.isArray(this.defaultChartOptions.series) ? this.defaultChartOptions.series[0] : {}), data: periodScatterData },
        { ...(Array.isArray(this.defaultChartOptions.series) ? this.defaultChartOptions.series[1] : {}), data: singleScatterData }
      ]
    };
  }

  onChartInit(ec: EChartsType) {
    this.echartsInstance = ec;
    this.echartsInstance.on('click', (params: any) => {
      if (params.componentType === 'series') {
        const seriesIndex = params.seriesIndex;
        const dataIndex = params.dataIndex;
        let eventId: string | undefined;

        if (
          this.chartOptions.series &&
          Array.isArray(this.chartOptions.series) &&
          this.chartOptions.series[seriesIndex]?.data &&
          Array.isArray(this.chartOptions.series[seriesIndex].data)
        ) {
          eventId = (this.chartOptions.series[seriesIndex].data[dataIndex] as any)[2];
        }

        if (eventId !== undefined) {
          const clickedEvent = this.timelineEvents.find(event => event.id === eventId);
          if (clickedEvent) {
            this.selectEntry(clickedEvent);
          }
        }
      }
    });
  }

  formatTooltip(params: any): string {
    // params is an array of data points under the tooltip trigger point
    if (params.length > 0) {
      const dataIndex = params[0].dataIndex;
      const seriesIndex = params[0].seriesIndex;
      const dataPoint = this.chartOptions.series && Array.isArray(this.chartOptions.series) && this.chartOptions.series[seriesIndex]?.data && Array.isArray(this.chartOptions.series[seriesIndex].data)
        ? (this.chartOptions.series[seriesIndex].data[dataIndex] as any)
        : undefined;

      if (!dataPoint) {
        return ''; // Return empty string if data point cannot be accessed
      }

      const eventId = dataPoint[2]; // Event ID is the third element in our data arrays
      const clickedEvent = this.timelineEvents.find(event => event.id === eventId);

      if (!clickedEvent) {
        return ''; // Return empty string if event not found
      }

      const startDate = clickedEvent.date!;
      const startDay = startDate.getDate().toString().padStart(2, '0');
      const startMonth = (startDate.getMonth() + 1).toString().padStart(2, '0');
      const startYear = startDate.getFullYear();

      let dateString = `${startDay}-${startMonth}-${startYear}`;
      if (clickedEvent.endDate) {
        const endDate = clickedEvent.endDate;
        const endDay = endDate.getDate().toString().padStart(2, '0');
        const endMonth = (endDate.getMonth() + 1).toString().padStart(2, '0');
        const endYear = endDate.getFullYear();
        dateString += ` - ${endDay}-${endMonth}-${endYear}`;
      }

      let tooltipString = `${dateString}<br>`;
      tooltipString += `<strong>${clickedEvent.title}</strong><br>`;
      if (clickedEvent.description) {
        tooltipString += clickedEvent.description;
      }
      return tooltipString;
    }
    return '';
  }

  onSubmit() {
    console.log(this.formData);
    if (this.formData.id) {
      // Editing existing entry
      if (this.formData.date) {
        // Pass the formData (which contains the id) and the updated data
        this.timelineService.updateTimelineEntry(this.formData, this.formData);
        this.selectedEntry = null; // Deselect after updating in the list
        this.resetForm(); // Reset form after update
      } else {
        alert('Please select a date for the timeline entry.');
      }
    } else {
      // Adding new entry
      if (this.formData.title && this.formData.date) {
        this.timelineService.addTimelineEntry(this.formData as TimelineEvent); // Cast for addDoc if necessary based on your service
        this.resetForm(); // Reset form after adding
      } else if (!this.formData.title) {
        alert('Please enter a title for the timeline entry.');
      } else {
        alert('Please select a date for the timeline entry.');
      }
    }


  }

  selectEntry(event: TimelineEvent): void {
    // Assign the selected event data to the formData, creating a copy to avoid
    // directly modifying the original event object in the timelineEvents array
    this.formData = {...event};
    this.selectedEntry = event; // Keep selectedEntry for list highlighting if needed
    this.cdr.detectChanges(); // Force update
  }

  resetForm(): void {
    this.formData = {title: '', description: null, date: null, endDate: null};
    this.selectedEntry = null; // Deselect in the list when resetting form
  }

  // Add this field to your class
  defaultChartOptions: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'line',
        label: { backgroundColor: '#6a7985' }
      },
      position: ['50%', 10] as any
    },
    xAxis: { type: 'time' },
    yAxis: { type: 'category', data: [] },
    series: [
      {
        data: [],
        type: 'scatter',
        symbolSize: 10,
        encode: { x: 0, y: 1 },
        itemStyle: { color: '#a90000' },
        label: {
          show: true,
          position: 'bottom',
          formatter: (params: any): string => {
            if (
              params &&
              Array.isArray(params.value) &&
              typeof params.value[1] === 'string'
            ) {
              const event = this.timelineEvents.find(e => e.title === params.value[1]);
              if (
                event &&
                event.date &&
                typeof params.value[0] === 'number' &&
                params.value[0] === event.date.getTime()
              ) {
                return params.value[1];
              }
            }
            return '';
          }
        },
      },
      {
        data: [],
        type: 'scatter',
        symbolSize: 15,
        encode: { x: 0, y: 1 },
        itemStyle: { color: '#2543ec' },
        label: {
          show: true,
          position: 'bottom',
          formatter: (params) => params.name // or use params.value if needed
        },
      }
    ]
  };

}
