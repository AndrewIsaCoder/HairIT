import { ChangeDetectionStrategy, Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Icon } from '../../shared/icon/icon';
import { Avatar } from '../../shared/avatar/avatar';
import { EmptyState } from '../../shared/empty-state/empty-state';
import { OwnerStore } from '../../core/services/owner-store';
import { Appointment, OpeningHours } from '../../core/models';
import { dayNumber, longDate, money, monthShort, weekdayShort } from '../../core/utils/format';

type Tab = 'agenda' | 'servicii' | 'echipa' | 'intervale' | 'setari';

const WEEKDAYS = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'];
const PHONE_PATTERN = /^[+]?[0-9 ().-]{9,20}$/;

const CATEGORIES = [
  'Salon de coafură',
  'Barbershop',
  'Salon de unghii',
  'Salon de înfrumusețare',
  'Salon de masaj'
];

/** Panoul proprietarului: agendă, servicii, echipă, intervale și setările salonului. */
@Component({
  selector: 'hairit-owner-page',
  imports: [NgFor, NgIf, NgClass, ReactiveFormsModule, RouterLink, Icon, Avatar, EmptyState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './owner-page.html',
  styleUrl: './owner-page.css'
})
export class OwnerPage implements OnInit {
  protected readonly store = inject(OwnerStore);

  protected readonly selectedId = signal<number | null>(null);
  protected readonly tab = signal<Tab>('agenda');
  protected readonly showServiceForm = signal(false);
  protected readonly onlyBooked = signal(false);
  protected readonly hours = signal<OpeningHours[]>([]);

  protected readonly weekdays = WEEKDAYS;
  protected readonly categories = CATEGORIES;
  protected readonly weekdayShort = weekdayShort;
  protected readonly dayNumber = dayNumber;
  protected readonly monthShort = monthShort;
  protected readonly longDate = longDate;
  protected readonly money = money;

  protected readonly tabs: Array<{ id: Tab; label: string }> = [
    { id: 'agenda', label: 'Agendă' },
    { id: 'servicii', label: 'Servicii' },
    { id: 'echipa', label: 'Echipă' },
    { id: 'intervale', label: 'Intervale' },
    { id: 'setari', label: 'Setări' }
  ];

  protected readonly serviceForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3)] }),
    category: new FormControl('Păr', { nonNullable: true }),
    description: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(200)] }),
    durationMin: new FormControl(60, { nonNullable: true, validators: [Validators.required, Validators.min(10)] }),
    price: new FormControl(100, { nonNullable: true, validators: [Validators.required, Validators.min(0)] })
  });

  protected readonly staffForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3)] }),
    role: new FormControl('Stilist', { nonNullable: true })
  });

  protected readonly slotsForm = new FormGroup({
    days: new FormControl(14, { nonNullable: true, validators: [Validators.required, Validators.min(1), Validators.max(60)] }),
    stepMin: new FormControl(90, { nonNullable: true, validators: [Validators.required, Validators.min(15)] })
  });

  protected readonly salonForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3)] }),
    category: new FormControl(CATEGORIES[0], { nonNullable: true }),
    city: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    address: new FormControl('', { nonNullable: true }),
    tagline: new FormControl('', { nonNullable: true }),
    description: new FormControl('', { nonNullable: true }),
    phone: new FormControl('', { nonNullable: true, validators: [Validators.pattern(PHONE_PATTERN)] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.email] })
  });

  protected readonly visibleSlots = computed(() => {
    const list = this.store.slots();
    return this.onlyBooked() ? list.filter((slot) => slot.status === 'booked') : list;
  });

  protected readonly bookedToday = computed(() => this.store.slots().filter((s) => s.status === 'booked').length);

  constructor() {
    // formularul de setări urmează salonul selectat
    effect(() => {
      const salon = this.store.current();
      if (!salon) return;

      this.salonForm.setValue({
        name: salon.name,
        category: salon.category,
        city: salon.city,
        address: salon.address,
        tagline: salon.tagline,
        description: (salon as unknown as { description?: string }).description ?? '',
        phone: salon.phone,
        email: (salon as unknown as { email?: string }).email ?? ''
      });

      this.hours.set(salon.hours ? salon.hours.map((hour) => ({ ...hour })) : []);
    });
  }

  ngOnInit(): void {
    this.store.loadSalons().subscribe({
      next: (list) => {
        if (list.length > 0) this.choose(list[0].id);
      }
    });
  }

  protected choose(salonId: number): void {
    this.selectedId.set(salonId);
    this.store.date.set('');
    this.store.select(salonId);
  }

  protected chooseDate(date: string): void {
    const id = this.selectedId();
    if (id) this.store.loadAgenda(id, date);
  }

  protected cancel(slot: Appointment): void {
    const id = this.selectedId();
    if (id) this.store.cancelBooking(id, slot.id).subscribe();
  }

  /* ------------------------------------------------------------ servicii */

  protected addService(): void {
    const id = this.selectedId();
    if (!id) return;

    if (this.serviceForm.invalid) {
      this.serviceForm.markAllAsTouched();
      return;
    }

    this.store.addService(id, this.serviceForm.getRawValue()).subscribe({
      next: () => {
        this.serviceForm.reset({ name: '', category: 'Păr', description: '', durationMin: 60, price: 100 });
        this.showServiceForm.set(false);
      }
    });
  }

  protected removeService(serviceId: number): void {
    const id = this.selectedId();
    if (id) this.store.removeService(id, serviceId).subscribe();
  }

  /* -------------------------------------------------------------- echipa */

  protected addStaff(): void {
    const id = this.selectedId();
    if (!id) return;

    if (this.staffForm.invalid) {
      this.staffForm.markAllAsTouched();
      return;
    }

    this.store.addStaff(id, this.staffForm.getRawValue()).subscribe({
      next: () => this.staffForm.reset({ name: '', role: 'Stilist' })
    });
  }

  protected removeStaff(staffId: number): void {
    const id = this.selectedId();
    if (id) this.store.removeStaff(id, staffId).subscribe();
  }

  /* ----------------------------------------------------------- intervale */

  protected generate(): void {
    const id = this.selectedId();
    if (!id || this.slotsForm.invalid) return;

    this.store.generateSlots(id, this.slotsForm.getRawValue()).subscribe({
      next: () => this.store.loadAgenda(id, '')
    });
  }

  protected clearSlots(): void {
    const id = this.selectedId();
    if (id) this.store.clearSlots(id).subscribe({ next: () => this.store.loadAgenda(id, '') });
  }

  /* -------------------------------------------------------------- setari */

  protected saveSalon(): void {
    const id = this.selectedId();
    if (!id) return;

    if (this.salonForm.invalid) {
      this.salonForm.markAllAsTouched();
      return;
    }

    const salon = this.store.current();
    this.store
      .updateSalon(id, { ...this.salonForm.getRawValue(), coverImage: salon?.coverImage ?? '' })
      .subscribe({ next: () => this.store.loadSalons().subscribe() });
  }

  protected saveHours(): void {
    const id = this.selectedId();
    if (id) this.store.saveHours(id, this.hours()).subscribe();
  }

  protected updateHour(weekday: number, patch: Partial<OpeningHours>): void {
    this.hours.update((list) => list.map((hour) => (hour.weekday === weekday ? { ...hour, ...patch } : hour)));
  }

  protected onHourInput(weekday: number, field: 'opens' | 'closes', event: Event): void {
    this.updateHour(weekday, { [field]: (event.target as HTMLInputElement).value } as Partial<OpeningHours>);
  }

  protected toggleClosed(weekday: number, event: Event): void {
    this.updateHour(weekday, { closed: (event.target as HTMLInputElement).checked ? 0 : 1 });
  }
}
