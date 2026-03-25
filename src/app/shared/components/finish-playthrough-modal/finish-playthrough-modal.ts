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
import { ConfirmModal } from '../confirm-modal/confirm-modal';

@Component({
  selector: 'app-finish-playthrough-modal',
  imports: [CommonModule, FormsModule, ConfirmModal],
  templateUrl: './finish-playthrough-modal.html',
  styleUrl: './finish-playthrough-modal.scss',
})
export class FinishPlaythroughModal implements OnInit {
  @Input() playthrough!: Playthrough;
  @ViewChild('dateInput') dateInput!: ElementRef;

  startedAtISO: string = new Date().toISOString().split('T')[0];
  startedAtDisplay: string = '';

  @Output() closed = new EventEmitter<void>();
  @Output() finished = new EventEmitter<Playthrough>();

  endDate!: string;
  hours!: number;
  completed = false;
  platinum = false;
  online = false;
  notes: string | null = null;
  isLoading = false;
  errorMessage: string | null = null;

  showConfirmModal = false;

  private removeKeyListener!: () => void;
  private picker!: Litepicker;

  constructor(
    private playthroughService: PlaythroughService,
    private renderer: Renderer2,
  ) {}

  ngOnInit(): void {
    // Precarga de datos
    this.endDate = new Date().toISOString().split('T')[0];
    this.hours = this.playthrough.hours ?? 0;
    this.completed = this.playthrough.completed;
    this.platinum = this.playthrough.platinum;
    this.online = this.playthrough.online ?? false;
    this.notes = this.playthrough.notes;

    // Bloquear scroll del body
    this.renderer.setStyle(document.body, 'overflow', 'hidden');

    // Listener ESC para cerrar modal
    this.removeKeyListener = this.renderer.listen('window', 'keydown', (event: KeyboardEvent) => {
      if (event.key === 'Escape') this.close();
    });
  }

  ngAfterViewInit(): void {
    const today = new Date();

    // Inicializar Litepicker
    this.picker = new Litepicker({
      element: this.dateInput.nativeElement,
      singleMode: true,
      format: 'DD MMM. YYYY',
      maxDate: today,
      minDate: this.playthrough.started_at,
      mobileFriendly: true,
      lang: 'es-ES',
      startDate: today,
    });

    const start = this.picker.getStartDate();
    if (start) {
      this.startedAtISO = start.format('YYYY-MM-DD');
      this.startedAtDisplay = start.format('DD MMM. YYYY');
      this.dateInput.nativeElement.value = this.startedAtDisplay;
    }

    // Actualizar fechas al seleccionar
    this.picker.on('selected', (date) => {
      this.startedAtISO = date.format('YYYY-MM-DD');
      this.startedAtDisplay = date.format('DD MMM. YYYY');
      this.dateInput.nativeElement.value = this.startedAtDisplay;
    });
  }

  onSubmit() {
    if (this.isLoading) return;

    this.showConfirmModal = true;
  }

  async finishPlaythrough() {
    this.errorMessage = null;

    // Validaciones manuales
    if (!this.startedAtISO) {
      this.errorMessage = 'Debes seleccionar una fecha válida';
      return;
    }

    if (this.hours === null || this.hours === undefined) {
      this.errorMessage = 'Debes indicar las horas jugadas';
      return;
    }

    if (this.hours < 0) {
      this.errorMessage = 'Las horas no pueden ser negativas';
      return;
    }

    const endedAt = new Date(this.startedAtISO);

    if (endedAt < this.playthrough.started_at) {
      this.errorMessage = 'La fecha no puede ser anterior al inicio';
      return;
    }

    this.isLoading = true;

    try {
      const updated = await this.playthroughService.finish(
        this.playthrough.id,
        endedAt,
        this.hours,
        this.completed,
        this.platinum,
        this.online,
        this.notes ?? undefined,
      );

      this.finished.emit(updated);
      this.close();
    } catch (err: any) {
      this.errorMessage = err.message ?? 'Error inesperado';
    } finally {
      this.isLoading = false;
    }
  }

  confirmFinish() {
    this.showConfirmModal = false;
    this.finishPlaythrough();
  }

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

  increment(input: HTMLInputElement) {
    const step = 1;
    const max = parseInt(input.max) || Infinity;
    let value = parseInt(input.value) || 0;
    value = Math.min(value + step, max);
    input.value = value.toString();
    this.hours = value;
  }

  decrement(input: HTMLInputElement) {
    const step = 1;
    const min = parseInt(input.min) || 0;
    let value = parseInt(input.value) || 0;
    value = Math.max(value - step, min);
    input.value = value.toString();
    this.hours = value;
  }

  close() {
    this.closed.emit();
  }

  ngOnDestroy(): void {
    // Restaurar scroll
    this.renderer.removeStyle(document.body, 'overflow');

    // Quitar listener ESC
    if (this.removeKeyListener) this.removeKeyListener();

    // Destruir Litepicker
    if (this.picker) this.picker.destroy();
  }
}
