import { Component, AfterViewInit, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SiteContentService } from '../../services/site-content.service';

@Component({
  selector: 'app-skills',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skills.component.html',
  styleUrls: ['./skills.component.scss'],
})
export class SkillsComponent implements OnInit, AfterViewInit {
  skills: any[] = [];
  tags: string[] = [];
  award: any = null;
  animated = false;

  constructor(private cms: SiteContentService) {}

  ngOnInit() {
    this.cms.getAll().subscribe(c => {
      const s = c['skills'];
      if (s) {
        this.skills = s.bars ?? [];
        this.tags = s.tags ?? [];
        this.award = s.award ?? null;
      }
    });
  }

  ngAfterViewInit() {
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) { this.animated = true; obs.disconnect(); }
    }, { threshold: 0.25 });
    const el = document.querySelector('.skills-sec');
    if (el) obs.observe(el);
  }
}
