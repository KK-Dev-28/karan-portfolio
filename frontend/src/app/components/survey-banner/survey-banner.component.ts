import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-survey-banner',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './survey-banner.component.html',
  styleUrls: ['./survey-banner.component.scss'],
})
export class SurveyBannerComponent {}
