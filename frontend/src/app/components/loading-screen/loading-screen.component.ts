import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-screen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-screen.component.html',
  styleUrl: './loading-screen.component.scss',
})
export class LoadingScreenComponent implements OnInit {
  @Output() done = new EventEmitter<void>();

  visible = true;
  hiding = false;

  ngOnInit() {
    // Simulate brief loading time, then fade out
    setTimeout(() => {
      this.hiding = true;
      setTimeout(() => {
        this.visible = false;
        this.done.emit();
      }, 700);
    }, 1800);
  }
}
