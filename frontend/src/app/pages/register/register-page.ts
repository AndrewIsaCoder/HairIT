import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthShell } from '../../shared/auth-shell/auth-shell';
import { Icon } from '../../shared/icon/icon';
import { AuthStore } from '../../core/services/auth-store';
import { AccountStore } from '../../core/services/account-store';

const PHONE_PATTERN = /^[+]?[0-9 ().-]{9,20}$/;

@Component({
  selector: 'hairit-register-page',
  imports: [NgIf, ReactiveFormsModule, RouterLink, AuthShell, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './register-page.html',
  styleUrl: './register-page.css'
})
export class RegisterPage {
  protected readonly auth = inject(AuthStore);
  private readonly account = inject(AccountStore);
  private readonly router = inject(Router);

  protected readonly role = signal<'client' | 'owner'>('client');

  protected readonly form = new FormGroup({
    fullName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3), Validators.maxLength(60)]
    }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    phone: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(PHONE_PATTERN)] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(8)] })
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.auth.register({ ...this.form.getRawValue(), role: this.role() }).subscribe({
      next: () => {
        this.account.refresh();
        this.router.navigate([this.role() === 'owner' ? '/salonul-meu' : '/contul-meu']);
      },
      error: () => undefined
    });
  }

  protected invalid(field: 'fullName' | 'email' | 'phone' | 'password'): boolean {
    const control = this.form.controls[field];
    return (control.touched && control.invalid) || Boolean(this.auth.fieldErrors()[field]);
  }

  protected serverError(field: string): string {
    return this.auth.fieldErrors()[field] ?? '';
  }
}
