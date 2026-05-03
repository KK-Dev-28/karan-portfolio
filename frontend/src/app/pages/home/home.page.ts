// src/app/pages/home/home.page.ts
import { Component } from '@angular/core';
import { NavbarComponent }     from '../../components/navbar/navbar.component';
import { HeroComponent }       from '../../components/hero/hero.component';
import { MarqueeComponent }    from '../../components/marquee/marquee.component';
import { ServicesComponent }   from '../../components/services/services.component';
import { SkillsComponent }     from '../../components/skills/skills.component';
import { ProjectsComponent }   from '../../components/projects/projects.component';
import { JournalFeedComponent } from '../../components/journal-feed/journal-feed.component';
import { ExperienceComponent } from '../../components/experience/experience.component';
import { GigsComponent }       from '../../components/gigs/gigs.component';
import { HirePricingComponent } from '../../components/hire-pricing/hire-pricing.component';
import { TestimonialsComponent } from '../../components/testimonials/testimonials.component';
import { FaqComponent }        from '../../components/faq/faq.component';
import { NewsletterStripComponent } from '../../components/newsletter-strip/newsletter-strip.component';
import { ContactComponent }    from '../../components/contact/contact.component';
import { FooterComponent }     from '../../components/footer/footer.component';
import { Cursor3dComponent }   from '../../components/cursor-3d/cursor-3d.component';
import { SourceOfferingComponent } from '../../components/source-offering/source-offering.component';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    NavbarComponent,
    HeroComponent,
    MarqueeComponent,
    ServicesComponent,
    SkillsComponent,
    ProjectsComponent,
    JournalFeedComponent,
    ExperienceComponent,
    GigsComponent,
    HirePricingComponent,
    TestimonialsComponent,
    FaqComponent,
    NewsletterStripComponent,
    ContactComponent,
    FooterComponent,
    Cursor3dComponent,
    SourceOfferingComponent,
  ],
  template: `
    <app-cursor-3d></app-cursor-3d>
    <app-navbar></app-navbar>
    <app-hero></app-hero>
    <app-marquee></app-marquee>
    <app-services></app-services>
    <app-skills></app-skills>
    <app-projects></app-projects>
    <app-journal-feed></app-journal-feed>
    <app-experience></app-experience>
    <app-gigs></app-gigs>
    <app-hire-pricing></app-hire-pricing>
    <app-testimonials></app-testimonials>
    <app-faq></app-faq>
    <app-source-offering></app-source-offering>
    <app-newsletter-strip></app-newsletter-strip>
    <app-contact></app-contact>
    <app-footer></app-footer>
  `,
})
export class HomePageComponent {}