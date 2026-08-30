import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Icon } from '../../shared/icon/icon';
import { Avatar } from '../../shared/avatar/avatar';
import { SalonCard } from '../../shared/salon-card/salon-card';
import { EmptyState } from '../../shared/empty-state/empty-state';
import { AuthStore } from '../../core/services/auth-store';
import { AccountStore } from '../../core/services/account-store';
import { SalonStore } from '../../core/services/salon-store';
import { Appointment, SalonCard as SalonCardModel } from '../../core/models';
import { longDate, money, relativeTime, whenLabel } from '../../core/utils/format';

type Tab = 'programari' | 'favorite' | 'notificari' | 'profil';

const PHONE_PATTERN = /^[+]?[0-9 ().-]{9,20}$/;

/** Contul clientului: programări, favorite, notificări și date personale. */
@Component({
  selector: 'hairit-account-page',
  imports: [NgFor, NgIf, NgClass, ReactiveFormsModule, RouterLink, Icon, Avatar, SalonCard, EmptyState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './account-page.html',
  styleUrl: './account-page.css'
})
export class AccountPage implements OnInit {
  protected readonly auth = inject(AuthStore);
  protected readonly account = inject(AccountStore);
  private readonly salons = inject(SalonStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly tab = signal<Tab>('programari');
  protected readonly cancelling = signal<number | null>(null);
  protected readonly savedProfile = signal(false);
  protected readonly passwordDone = signal(false);

  protected readonly longDate = longDate;
  protected readonly money = money;
  protected readonly relative = relativeTime;
  protected readonly whenLabel = whenLabel;

  protected readonly tabs: Array<{ id: Tab; label: string }> = [
    { id: 'programari', label: 'Programările mele' },
    { id: 'favorite', label: 'Favorite' },
    { id: 'notificari', label: 'Notificări' },
    { id: 'profil', label: 'Profil' }
  ];

  protected readonly upcoming = computed(() => this.account.appointments().upcoming);
  protected readonly past = computed(() => this.account.appointments().past);

  protected readonly profileForm = new FormGroup({
    fullName: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3)] }),
    phone: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(PHONE_PATTERN)] })
  });

  protected readonly passwordForm = new FormGroup({
    currentPassword: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    newPassword: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(8)] })
  });

  ngOnInit(): void {
    this.account.refresh();
    this.account.loadFavorites();

    const user = this.auth.user();
    if (user) this.profileForm.setValue({ fullName: user.fullName, phone: user.phone });

    this.route.queryParamMap.subscribe((params) => {
      const requested = params.get('tab') as Tab | null;
      if (requested && this.tabs.some((tab) => tab.id === requested)) this.tab.set(requested);
    });
  }

  protected selectTab(tab: Tab): void {
    this.tab.set(tab);
    this.router.navigate([], { relativeTo: this.route, queryParams: { tab }, replaceUrl: true });
    if (tab === 'favorite') this.account.loadFavorites();
    if (tab === 'notificari') this.account.loadNotifications();
  }

  protected cancel(appointment: Appointment): void {
    this.cancelling.set(appointment.id);
    this.account.cancel(appointment.id).subscribe({
      next: () => this.cancelling.set(null),
      error: () => this.cancelling.set(null)
    });
  }

  protected toggleFavorite(salon: SalonCardModel): void {
    this.salons.toggleFavorite(salon).subscribe({ next: () => this.account.loadFavorites() });
  }

  protected saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.auth.updateProfile(this.profileForm.getRawValue()).subscribe({
      next: () => this.savedProfile.set(true),
      error: () => this.savedProfile.set(false)
    });
  }

  protected changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.auth.changePassword(this.passwordForm.getRawValue()).subscribe({
      next: () => {
        this.passwordDone.set(true);
        this.account.clear();
        setTimeout(() => this.router.navigate(['/autentificare']), 1500);
      },
      error: () => undefined
    });
  }

  protected markRead(id: number): void {
    this.account.markRead(id);
  }
}
