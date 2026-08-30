import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { Icon } from '../../shared/icon/icon';
import { OwnerStore } from '../../core/services/owner-store';
import { AuthStore } from '../../core/services/auth-store';
import { AccountStore } from '../../core/services/account-store';

const PHONE_PATTERN = /^[+]?[0-9 ().-]{9,20}$/;

/** Fotografiile disponibile pentru coperta salonului. */
const COVERS = [
  { src: 'images/hero-primary.jpg', label: 'Salon modern' },
  { src: 'images/studio-interior.jpg', label: 'Interior clasic' },
  { src: 'images/salon-barber.jpg', label: 'Barbershop' },
  { src: 'images/salon-fade.jpg', label: 'Frizerie' },
  { src: 'images/salon-nails.jpg', label: 'Unghii' },
  { src: 'images/service-balayage.jpg', label: 'Culoare' },
  { src: 'images/service-ritual.jpg', label: 'Îngrijire' },
  { src: 'images/editorial-portrait.jpg', label: 'Beauty' }
];

const CATEGORIES = [
  'Salon de coafură',
  'Barbershop',
  'Salon de unghii',
  'Salon de înfrumusețare',
  'Salon de masaj'
];

/** Formularul prin care un utilizator își adaugă propriul salon în platformă. */
@Component({
  selector: 'hairit-new-salon-page',
  imports: [NgFor, NgIf, NgClass, ReactiveFormsModule, RouterLink, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './new-salon-page.html',
  styleUrl: './new-salon-page.css'
})
export class NewSalonPage {
  protected readonly store = inject(OwnerStore);
  protected readonly auth = inject(AuthStore);
  private readonly account = inject(AccountStore);
  private readonly router = inject(Router);

  protected readonly covers = COVERS;
  protected readonly categories = CATEGORIES;
  protected readonly cover = signal(COVERS[0].src);

  protected readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3), Validators.maxLength(60)]
    }),
    category: new FormControl(CATEGORIES[0], { nonNullable: true, validators: [Validators.required] }),
    city: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
    address: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(120)] }),
    tagline: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(120)] }),
    description: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(1000)] }),
    phone: new FormControl('', { nonNullable: true, validators: [Validators.pattern(PHONE_PATTERN)] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.email] })
  });

  /** Adresa completa afisata in previzualizare. */
  protected location(): string {
    const address = this.form.controls.address.value.trim();
    const city = this.form.controls.city.value.trim();

    if (address && city) return `${address}, ${city}`;
    return address || city || 'Adresa';
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.store
      .createSalon({ ...this.form.getRawValue(), coverImage: this.cover() })
      // contul devine proprietar pe server; asteptam rolul nou inainte de navigare,
      // altfel garda rutei /salonul-meu ne trimite inapoi la cont
      .pipe(switchMap(() => this.auth.refreshUser()))
      .subscribe({
        next: () => {
          this.account.loadNotifications();
          this.router.navigate(['/salonul-meu']);
        },
        error: () => undefined
      });
  }

  protected invalid(field: 'name' | 'category' | 'city' | 'address' | 'tagline' | 'description' | 'phone' | 'email'): boolean {
    const control = this.form.controls[field];
    return (control.touched && control.invalid) || Boolean(this.store.fieldErrors()[field]);
  }

  protected serverError(field: string): string {
    return this.store.fieldErrors()[field] ?? '';
  }
}
