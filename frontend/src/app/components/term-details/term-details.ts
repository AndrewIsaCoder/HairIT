import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NgClass, NgIf } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Icon } from '../../shared/icon/icon';
import { BookingStore } from '../../core/services/booking-store';
import { longDate, money } from '../../core/utils/format';

const PHONE_PATTERN = /^[+]?[0-9 ().-]{9,20}$/;

/**
 * Panoul de detalii al programarii selectate.
 * Cand intervalul este liber afiseaza formularul de rezervare,
 * cand este ocupat afiseaza mesajul de indisponibilitate.
 */
@Component({
  selector: 'hairit-term-details',
  imports: [NgIf, NgClass, ReactiveFormsModule, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './term-details.html',
  styleUrl: './term-details.css'
})
export class TermDetails {
  protected readonly store = inject(BookingStore);

  protected readonly term = this.store.selectedTerm;
  protected readonly price = computed(() => {
    const term = this.term();
    return term ? money(term.price) : '';
  });
  protected readonly day = computed(() => {
    const term = this.term();
    return term ? longDate(term.date) : '';
  });

  protected readonly form = new FormGroup({
    clientName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3), Validators.maxLength(60)]
    }),
    phone: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(PHONE_PATTERN)]
    }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.email] }),
    notes: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(300)] })
  });

  /** Trimite rezervarea si trece programarea din „available” in „booked”. */
  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.store.reserve(this.form.getRawValue());
    this.form.reset();
  }

  protected cancel(): void {
    const term = this.term();
    if (term) this.store.cancel(term);
  }

  protected invalid(control: 'clientName' | 'phone' | 'email' | 'notes'): boolean {
    const field = this.form.controls[control];
    return field.touched && field.invalid;
  }
}
