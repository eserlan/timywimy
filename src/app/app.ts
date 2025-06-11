import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { TimelineComponent } from './timeline/timeline';

@Component({
  selector: 'app-root',
  imports: [MatToolbarModule, TimelineComponent, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected title = 'myapp';
  public currentYear = new Date().getFullYear();
}
