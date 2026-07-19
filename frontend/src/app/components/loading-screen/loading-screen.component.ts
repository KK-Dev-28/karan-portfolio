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
    // Brief brand moment only — never make visitors wait on fake loading
    setTimeout(() => {
      this.hiding = true;
      setTimeout(() => {
        this.visible = false;
        this.done.emit();
      }, 500);
    }, 900);
  }
}
