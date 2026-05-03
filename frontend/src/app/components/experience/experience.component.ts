// experience.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({ 
  selector: 'app-experience', 
  standalone: true,
  imports: [CommonModule],
  templateUrl: './experience.component.html', 
  styleUrls: ['./experience.component.scss'] 
})
export class ExperienceComponent {
  items = [
    {
      date:    'July 2024 – Present',
      role:    'Junior Software Developer',
      company: 'CS Soft Solutions (India) Pvt. Ltd.',
      location:'Mohali, Punjab',
      desc:    'Building production Angular + .NET Web API applications. Led development on the Enterprise Inventory Management System with Apache Kafka real-time messaging. Awarded High Productivity in the .NET department.',
      isEdu:   false,
      badge:   '🏆 Award',
    },
    {
      date:    'Jan 2024 – Jun 2024',
      role:    'Software Developer Intern',
      company: 'CS Soft Solutions (India) Pvt. Ltd.',
      location:'Mohali, Punjab',
      desc:    'Joined as intern and quickly ramped up on Angular and ASP.NET Web API. Contributed to live client projects within the first month of joining.',
      isEdu:   false,
      badge:   '',
    },
    {
      date:    'Pursuing',
      role:    'MCA — Master of Computer Applications',
      company: 'Lovely Professional University',
      location:'Online',
      desc:    '',
      isEdu:   true,
      badge:   '',
    },
    {
      date:    '2023',
      role:    'BCA — Bachelor of Computer Applications',
      company: 'Anglo Sanskrit College',
      location:'Khanna',
      desc:    '',
      isEdu:   true,
      badge:   '',
    },
    {
      date:    '2019',
      role:    'Diploma in Computer Applications',
      company: 'Ideal Computer Center',
      location:'',
      desc:    '',
      isEdu:   true,
      badge:   '',
    },
  ];
}