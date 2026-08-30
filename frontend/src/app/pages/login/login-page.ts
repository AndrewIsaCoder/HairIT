import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthShell } from '../../shared/auth-shell/auth-shell';
import { Icon } from '../../shared/icon/icon';
import { AuthStore } from '../../core/services/auth-store';
import { AccountStore } from '../../core/services/account-store';

@Component({
  selector: 'hairit-login-page',
  imports: [NgIf, ReactiveFormsModule, RouterLink, AuthShell, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login-page.html',
  styleUrl: './login-page.css'
})
export class LoginPage {
  protected readonly auth = inject(AuthStore);
  private readonly account = inject(AccountStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] })
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.account.refresh();
        const redirect = this.route.snapshot.queryParamMap.get('redirect') ?? '/contul-meu';
        this.router.navigateByUrl(redirect);
      },
      error: () => undefined
    });
  }

  /** Completează formularul cu un cont demo, ca să poată fi testat rapid. */
  protected useDemo(email: string): void {
    this.form.setValue({ email, password: 'parola123' });
  }

  protected invalid(field: 'email' | 'password'): boolean {
    const control = this.form.controls[field];
    return control.touched && control.invalid;
  }
}
