import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Icon } from '../../shared/icon/icon';
import { Avatar } from '../../shared/avatar/avatar';
import { EmptyState } from '../../shared/empty-state/empty-state';
import { OwnerStore } from '../../core/services/owner-store';
import { Appointment } from '../../core/models';
import { dayNumber, longDate, money, monthShort, weekdayShort } from '../../core/utils/format';

/** Panoul proprietarului: agenda zilei, cifrele salonului și serviciile. */
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
  protected readonly showServiceForm = signal(false);
  protected readonly onlyBooked = signal(false);

  protected readonly weekdayShort = weekdayShort;
  protected readonly dayNumber = dayNumber;
  protected readonly monthShort = monthShort;
  protected readonly longDate = longDate;
  protected readonly money = money;

  protected readonly serviceForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3)] }),
    category: new FormControl('Păr', { nonNullable: true }),
    description: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(200)] }),
    durationMin: new FormControl(60, { nonNullable: true, validators: [Validators.required, Validators.min(10)] }),
    price: new FormControl(100, { nonNullable: true, validators: [Validators.required, Validators.min(0)] })
  });

  protected readonly visibleSlots = computed(() => {
    const list = this.store.slots();
    return this.onlyBooked() ? list.filter((slot) => slot.status === 'booked') : list;
  });

  protected readonly bookedToday = computed(() => this.store.slots().filter((s) => s.status === 'booked').length);
  protected readonly freeToday = computed(() => this.store.slots().filter((s) => s.status === 'available').length);

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
}
