import { ChangeDetectionStrategy, Component, HostListener, inject, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Icon } from '../../shared/icon/icon';
import { BookingStore } from '../../core/services/booking-store';
import { UiState } from '../../core/services/ui-state';

const PHONE_PATTERN = /^[+]?[0-9 ().-]{9,20}$/;

/**
 * Formular de contact rapid, deschis din meniu sau din footer.
 * Cererea este preluata de receptie, nu ocupa un interval din calendar.
 */
@Component({
  selector: 'hairit-request-modal',
  imports: [NgIf, NgFor, ReactiveFormsModule, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './request-modal.html',
  styleUrl: './request-modal.css'
})
export class RequestModal {
  protected readonly ui = inject(UiState);
  protected readonly store = inject(BookingStore);

  protected readonly sending = signal(false);
  protected readonly sent = signal(false);

  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3)] }),
    phone: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(PHONE_PATTERN)]
    }),
    service: new FormControl('', { nonNullable: true }),
    message: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(300)] })
  });

  @HostListener('document:keydown.escape')
  protected close(): void {
    this.ui.closeModal();
    setTimeout(() => this.reset(), 300);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.sending.set(true);
    setTimeout(() => {
      this.sending.set(false);
      this.sent.set(true);
    }, 700);
  }

  protected invalid(control: 'name' | 'phone' | 'message'): boolean {
    const field = this.form.controls[control];
    return field.touched && field.invalid;
  }

  private reset(): void {
    this.form.reset();
    this.sent.set(false);
  }
}
