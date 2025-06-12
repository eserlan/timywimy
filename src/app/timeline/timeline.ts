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
import { NgxEchartsModule } from 'ngx-echarts';
import { EChartsOption } from 'echarts'; // Import the EChartsOption type
import type { EChartsType } from 'echarts/types/dist/shared'; // Import EChartsType
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
    MatButtonModule, MatButtonModule,
    NgxEchartsModule,
    MatCardModule
  ],
  templateUrl: './timeline.html',
  styleUrl: './timeline.css',
  providers: [TimelineService]

})
export class TimelineComponent implements OnInit {

  formData: TimelineEvent = { title: '', description: null, date: null, endDate: null }; // Use a single object for form data
  selectedEntry: TimelineEvent | null = null;


  newEntryDate: Date | null = null;
  newEntryEndDate: Date | null = null;
  timelineEvents: TimelineEvent[] = [];
  private echartsInstance!: EChartsType; // Property to hold the ECharts instance
  chartOptions: EChartsOption = {};

  constructor(private timelineService: TimelineService) { }

  ngOnInit() {
    this.timelineService.getTimelineEvents().subscribe((events) => {
      this.timelineEvents = events.map(event => ({
        ...event,
        date: event.date && typeof event.date.toDate === 'function' ? event.date.toDate() : (event.date ? new Date(event.date) : null),
        endDate: event.endDate && typeof event.endDate.toDate === 'function' ? event.endDate.toDate() : (event.endDate ? new Date(event.endDate) : null)
      }));
      console.log('Timeline Events:', this.timelineEvents);
      this.resetForm(); // Initialize form with empty data
      this.updateChartOptions();
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
      tooltip: {
        trigger: 'axis',
        formatter: this.formatTooltip.bind(this), // Assign the formatter function
        axisPointer: {
          type: 'line',
          label: {
            backgroundColor: '#6a7985'
          }
        },
        position: ['50%', 10] as any // Center horizontally, 10px from top
      },
      xAxis: {
        type: 'time'
      },
      yAxis: {
        type: 'category',
        data: this.timelineEvents.map(event => event.title), // Include all titles for y-axis categories
      },
      series: [
        {
          data: periodScatterData,
          type: 'scatter', // Change type to scatter
          symbolSize: 5, // Example size for scatter dots
          encode: {
            x: 0, // Map the first column (date) to the x-axis
            y: 1, // Map the second column (title) to the y-axis
          },
          itemStyle: {
            color: '#a90000' // Example color for period scatter dots
          },
        },
        {
          data: singleScatterData,
          type: 'scatter',
          symbolSize: 10, // Example size for scatter dots
          encode: {
            x: 0, // Map the first column of data to the x-axis (date)
            y: 1  // Map the second column of data to the y-axis (title)
          },
          itemStyle: {
            color: '#00a900' // Example color for scatter dots
          }
        }
      ],
    };
  }

  onChartInit(ec: EChartsType) {
    this.echartsInstance = ec;
    // Add click listener after chart options are updated and instance is available
    this.echartsInstance.on('click', (params: any) => {
      console.log('Clicked data params:', params.data);
      if (params.componentType === 'series') {
        const dataIndex = params.dataIndex;
        let eventId: string | undefined;

        if (this.chartOptions.series && Array.isArray(this.chartOptions.series) && this.chartOptions.series.length > 0 && this.chartOptions.series[0].data && Array.isArray(this.chartOptions.series[0].data)) {
          eventId = (this.chartOptions.series[0].data[dataIndex] as any)[2];
        }
        let clickedEvent: TimelineEvent | undefined;

        if (eventId !== undefined) {
          // Find the original event object using the ID
          clickedEvent = this.timelineEvents.find(event => event.id === eventId);
          console.log('clickedEvent', clickedEvent);
          if (clickedEvent) {
            console.log('setting select entry');
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
    this.formData = { ...event };
    this.selectedEntry = event; // Keep selectedEntry for list highlighting if needed
  }

  resetForm(): void {
    this.formData = { title: '', description: null, date: null, endDate: null };
    this.selectedEntry = null; // Deselect in the list when resetting form
  }
}
