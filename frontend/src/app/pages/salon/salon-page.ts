import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Icon } from '../../shared/icon/icon';
import { Rating } from '../../shared/rating/rating';
import { Avatar } from '../../shared/avatar/avatar';
import { Reveal } from '../../shared/reveal/reveal';
import { EmptyState } from '../../shared/empty-state/empty-state';
import { SalonStore } from '../../core/services/salon-store';
import { AccountStore } from '../../core/services/account-store';
import { AuthStore } from '../../core/services/auth-store';
import { Appointment, DaySummary, SalonDetail, SalonService } from '../../core/models';
import {
  dayNumber,
  duration,
  longDate,
  money,
  monthShort,
  relativeTime,
  weekdayShort
} from '../../core/utils/format';

const PHONE_PATTERN = /^[+]?[0-9 ().-]{9,20}$/;
const WEEKDAYS = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'];

/** Pagina unui salon: prezentare, flux de rezervare, echipă și recenzii. */
@Component({
  selector: 'hairit-salon-page',
  imports: [NgFor, NgIf, NgClass, ReactiveFormsModule, RouterLink, Icon, Rating, Avatar, Reveal, EmptyState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './salon-page.html',
  styleUrl: './salon-page.css'
})
export class SalonPage implements OnInit {
  private readonly store = inject(SalonStore);
  protected readonly account = inject(AccountStore);
  protected readonly auth = inject(AuthStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly salon = signal<SalonDetail | null>(null);
  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);

  /** pașii fluxului de rezervare */
  protected readonly selectedService = signal<SalonService | null>(null);
  protected readonly selectedStaffId = signal<number | null>(null);
  protected readonly selectedDate = signal('');
  protected readonly selectedSlot = signal<Appointment | null>(null);
  protected readonly onlyFree = signal(true);

  protected readonly days = signal<DaySummary[]>([]);
  protected readonly slots = signal<Appointment[]>([]);
  protected readonly slotsLoading = signal(false);
  protected readonly confirmed = signal<Appointment | null>(null);

  protected readonly reviewRating = signal(5);
  protected readonly reviewSaved = signal(false);

  protected readonly form = new FormGroup({
    clientName: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3)] }),
    phone: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(PHONE_PATTERN)] }),
    notes: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(300)] })
  });

  protected readonly reviewForm = new FormGroup({
    comment: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(500)] })
  });

  protected readonly weekdayShort = weekdayShort;
  protected readonly dayNumber = dayNumber;
  protected readonly monthShort = monthShort;
  protected readonly longDate = longDate;
  protected readonly relative = relativeTime;
  protected readonly money = money;
  protected readonly duration = duration;
  protected readonly weekdays = WEEKDAYS;

  /** intervalele afișate, după filtrul „doar libere” */
  protected readonly visibleSlots = computed(() => {
    const list = this.slots();
    return this.onlyFree() ? list.filter((slot) => slot.status === 'available') : list;
  });

  protected readonly freeCount = computed(() => this.slots().filter((s) => s.status === 'available').length);
  protected readonly bookedCount = computed(() => this.slots().filter((s) => s.status === 'booked').length);

  protected readonly staffList = computed(() => this.salon()?.staff ?? []);
  protected readonly canBook = computed(() => this.selectedSlot() !== null && this.selectedSlot()!.status === 'available');

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => this.load(params.get('slug') ?? ''));
  }

  private load(slug: string): void {
    this.loading.set(true);
    this.notFound.set(false);
    this.confirmed.set(null);

    this.store.getSalon(slug).subscribe({
      next: (salon) => {
        this.salon.set(salon);
        this.loading.set(false);
        this.reviewRating.set(salon.myReview?.rating ?? 5);
        this.reviewForm.setValue({ comment: salon.myReview?.comment ?? '' });
        this.prefillClient();
        this.loadDays();
      },
      error: () => {
        this.loading.set(false);
        this.notFound.set(true);
      }
    });
  }

  private prefillClient(): void {
    const user = this.auth.user();
    if (user) this.form.patchValue({ clientName: user.fullName, phone: user.phone });
  }

  private loadDays(): void {
    const salon = this.salon();
    if (!salon) return;

    const options = {
      serviceId: this.selectedService()?.id,
      staffId: this.selectedStaffId() ?? undefined
    };

    this.store.getDays(salon.slug, options).subscribe({
      next: (days) => {
        this.days.set(days);
        const current = this.selectedDate();
        const stillValid = days.some((day) => day.date === current);
        const next = stillValid ? current : days.find((day) => day.available > 0)?.date ?? days[0]?.date ?? '';
        this.selectedDate.set(next);
        this.loadSlots();
      }
    });
  }

  private loadSlots(): void {
    const salon = this.salon();
    if (!salon || !this.selectedDate()) {
      this.slots.set([]);
      return;
    }

    this.slotsLoading.set(true);
    this.store
      .getSlots(salon.slug, {
        date: this.selectedDate(),
        serviceId: this.selectedService()?.id,
        staffId: this.selectedStaffId() ?? undefined
      })
      .subscribe({
        next: (slots) => {
          this.slots.set(slots);
          this.slotsLoading.set(false);
          const selected = this.selectedSlot();
          if (selected && !slots.some((slot) => slot.id === selected.id)) this.selectedSlot.set(null);
        },
        error: () => this.slotsLoading.set(false)
      });
  }

  /* ------------------------------------------------------------- acțiuni */

  protected chooseService(service: SalonService | null): void {
    this.selectedService.set(service);
    this.selectedSlot.set(null);
    this.loadDays();
  }

  protected chooseStaff(staffId: number | null): void {
    this.selectedStaffId.set(staffId);
    this.selectedSlot.set(null);
    this.loadDays();
  }

  protected chooseDate(date: string): void {
    this.selectedDate.set(date);
    this.selectedSlot.set(null);
    this.loadSlots();
  }

  /** La clic pe un interval: dacă e liber se poate rezerva, dacă e ocupat afișăm un mesaj. */
  protected chooseSlot(slot: Appointment): void {
    this.selectedSlot.set(slot);
    this.account.error.set('');
    this.confirmed.set(null);
  }

  protected toggleFree(value: boolean): void {
    this.onlyFree.set(value);
  }

  protected book(): void {
    const slot = this.selectedSlot();
    if (!slot || slot.status !== 'available') return;

    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/autentificare'], { queryParams: { redirect: this.router.url } });
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.account.reserve(slot.id, this.form.getRawValue()).subscribe({
      next: (appointment) => {
        this.confirmed.set(appointment);
        this.selectedSlot.set(appointment);
        this.loadSlots();
        this.loadDays();
      },
      error: () => undefined
    });
  }

  protected toggleFavorite(): void {
    const salon = this.salon();
    if (!salon) return;

    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/autentificare'], { queryParams: { redirect: this.router.url } });
      return;
    }

    this.store.toggleFavorite(salon).subscribe({
      next: () => this.salon.set({ ...salon, isFavorite: !salon.isFavorite })
    });
  }

  protected saveReview(): void {
    const salon = this.salon();
    if (!salon) return;

    this.account
      .saveReview(salon.slug, { rating: this.reviewRating(), comment: this.reviewForm.getRawValue().comment })
      .subscribe({
        next: () => {
          this.reviewSaved.set(true);
          this.store.getSalon(salon.slug).subscribe({ next: (fresh) => this.salon.set(fresh) });
        }
      });
  }

  protected invalid(field: 'clientName' | 'phone' | 'notes'): boolean {
    const control = this.form.controls[field];
    return control.touched && control.invalid;
  }

  protected staffName(id: number | null): string {
    if (id === null) return 'Oricine este disponibil';
    return this.staffList().find((member) => member.id === id)?.name ?? '';
  }
}
