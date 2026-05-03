// contact.component.ts
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ContactService } from '../../services/contact.service';

@Component({ 
  selector: 'app-contact', 
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact.component.html', 
  styleUrls: ['./contact.component.scss'] 
})
export class ContactComponent {
  form:    FormGroup;
  loading  = false;
  success  = false;
  errMsg   = '';

  constructor(private fb: FormBuilder, private svc: ContactService) {
    this.form = this.fb.group({
      name:    ['', [Validators.required, Validators.maxLength(100)]],
      email:   ['', [Validators.required, Validators.email]],
      phone:   [''],
      subject: ['', [Validators.required, Validators.maxLength(200)]],
      message: ['', [Validators.required, Validators.maxLength(3000)]],
    });
  }

  get f() { return this.form.controls; }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true; this.errMsg = '';
    this.svc.send(this.form.value).subscribe({
      next:  () => { this.loading = false; this.success = true; this.form.reset(); },
      error: () => { this.loading = false; this.errMsg = 'Failed to send. Please WhatsApp me directly.'; },
    });
  }

  reset() { this.success = false; }
}