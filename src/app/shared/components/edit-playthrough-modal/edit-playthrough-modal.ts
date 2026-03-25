import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  OnDestroy,
  Renderer2,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Litepicker from 'litepicker';
import { Playthrough } from '../../../models/playtrough.model';
import { PlaythroughService } from '../../../services/playtrough.service';

@Component({
  selector: 'app-edit-playthrough-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-playthrough-modal.html',
  styleUrl: './edit-playthrough-modal.scss',
})
export class EditPlaythroughModal implements OnInit, AfterViewInit, OnDestroy {
  @Input() playthrough!: Playthrough;
  @Output() closed = new EventEmitter<void>();
  @Output() updated = new EventEmitter<Playthrough>();
  @Output() deleted = new EventEmitter<void>();

  @ViewChild('dateInput') dateInput!: ElementRef;
  @ViewChild('endDateInput') endDateInput?: ElementRef;

  startedAtISO!: string;
  endedAtISO: string | null = null;
  hours!: number;
  completed = false;
  platinum = false;
  notes: string | null = null;
  online = false;

  isLoading = false;
  confirmingDelete = false;
  errorMessage: string | null = null;

  private picker!: Litepicker;
  private endPicker?: Litepicker;
  private removeKeyListener!: () => void;
  private confirmTimeout?: ReturnType<typeof setTimeout>;

  constructor(
    private playthroughService: PlaythroughService,
    private renderer: Renderer2,
  ) {}

  get isPlaying(): boolean {
    return this.playthrough.status === 'playing';
  }

  ngOnInit(): void {
    this.startedAtISO = this.playthrough.started_at.toISOString().split('T')[0];
    this.hours = this.playthrough.hours ?? 0;
    this.completed = this.playthrough.completed;
    this.platinum = this.playthrough.platinum;
    this.online = this.playthrough.online ?? false;
    this.notes = this.playthrough.notes;

    if (this.playthrough.ended_at) {
      this.endedAtISO = this.playthrough.ended_at.toISOString().split('T')[0];
    }

    this.renderer.setStyle(document.body, 'overflow', 'hidden');

    this.removeKeyListener = this.renderer.listen('window', 'keydown', (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (this.confirmingDelete) {
          this.confirmingDelete = false;
        } else {
          this.close();
        }
      }
    });
  }

  ngAfterViewInit(): void {
    const startDate = new Date(this.startedAtISO);

    this.picker = new Litepicker({
      element: this.dateInput.nativeElement,
      singleMode: true,
      format: 'DD MMM. YYYY',
      mobileFriendly: true,
      lang: 'es-ES',
      startDate,
    });

    this.dateInput.nativeElement.value = this.picker.getStartDate()?.format('DD MMM. YYYY');

    this.picker.on('selected', (date) => {
      this.startedAtISO = date.format('YYYY-MM-DD');
      this.dateInput.nativeElement.value = date.format('DD MMM. YYYY');

      if (this.endPicker) {
        this.endPicker.setOptions({ minDate: new Date(this.startedAtISO) });
      }
    });

    if (this.endDateInput && this.endedAtISO) {
      const endDate = new Date(this.endedAtISO);

      this.endPicker = new Litepicker({
        element: this.endDateInput.nativeElement,
        singleMode: true,
        format: 'DD MMM. YYYY',
        mobileFriendly: true,
        lang: 'es-ES',
        startDate: endDate,
        minDate: startDate,
      });

      this.endDateInput.nativeElement.value = this.endPicker.getStartDate()?.format('DD MMM. YYYY');

      this.endPicker.on('selected', (date) => {
        this.endedAtISO = date.format('YYYY-MM-DD');
        this.endDateInput!.nativeElement.value = date.format('DD MMM. YYYY');
      });
    }
  }

  async updatePlaythrough() {
    this.errorMessage = null;

    if (!this.startedAtISO) {
      this.errorMessage = 'Debes seleccionar una fecha válida';
      return;
    }

    if (this.endedAtISO && this.endedAtISO < this.startedAtISO) {
      this.errorMessage = 'La fecha de fin no puede ser anterior a la de inicio';
      return;
    }

    if (this.hours < 0) {
      this.errorMessage = 'Las horas no pueden ser negativas';
      return;
    }

    this.isLoading = true;

    try {
      const updatedPlaythrough = await this.playthroughService.update(
        this.playthrough.id,
        new Date(this.startedAtISO),
        this.isPlaying ? 0 : this.hours,
        this.isPlaying ? false : this.completed,
        this.isPlaying ? false : this.platinum,
        this.isPlaying ? false : this.online,
        this.notes ?? undefined,
        this.endedAtISO ? new Date(this.endedAtISO) : undefined,
      );

      this.updated.emit(updatedPlaythrough);
      this.close();
    } catch (err: any) {
      this.errorMessage = err.message ?? 'Error inesperado';
    } finally {
      this.isLoading = false;
    }
  }

  // ===== DELETE =====

  onDeleteClick() {
    if (!this.confirmingDelete) {
      // Primer click: pide confirmación y cancela solo si no se confirma en 3s
      this.confirmingDelete = true;
      this.confirmTimeout = setTimeout(() => {
        this.confirmingDelete = false;
      }, 3000);
    } else {
      // Segundo click: borra
      clearTimeout(this.confirmTimeout);
      this.deletePlaythrough();
    }
  }

  private async deletePlaythrough() {
    this.isLoading = true;
    try {
      await this.playthroughService.delete(this.playthrough.id);
      this.deleted.emit();
      this.close();
    } catch (err: any) {
      this.errorMessage = err.message ?? 'Error al borrar la partida';
      this.confirmingDelete = false;
    } finally {
      this.isLoading = false;
    }
  }

  // ===== FORM HELPERS =====

  onCompletedChange() {
    if (this.completed) {
      this.online = false;
    } else {
      this.platinum = false;
    }
  }

  onOnlineChange() {
    if (this.online) {
      this.completed = false;
    } else {
      this.platinum = false;
    }
  }

  onPlatinumChange() {
    if (this.platinum) this.completed = true;
  }

  increment(input: HTMLInputElement) {
    let value = parseInt(input.value) || 0;
    value++;
    input.value = value.toString();
    this.hours = value;
  }

  decrement(input: HTMLInputElement) {
    let value = parseInt(input.value) || 0;
    value = Math.max(0, value - 1);
    input.value = value.toString();
    this.hours = value;
  }

  close() {
    this.closed.emit();
  }

  ngOnDestroy(): void {
    this.renderer.removeStyle(document.body, 'overflow');
    if (this.removeKeyListener) this.removeKeyListener();
    if (this.picker) this.picker.destroy();
    if (this.endPicker) this.endPicker.destroy();
    clearTimeout(this.confirmTimeout);
  }
}
