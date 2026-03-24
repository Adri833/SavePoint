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
import Litepicker from 'litepicker';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlaythroughService } from '../../../services/playtrough.service';

@Component({
  selector: 'app-start-playthrough-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './start-playthrough-modal.html',
  styleUrls: ['./start-playthrough-modal.scss'],
})
export class StartPlaythroughModal implements OnInit, OnDestroy, AfterViewInit {
  @Input() gameId!: number;
  @Output() closed = new EventEmitter<void>();
  @Output() started = new EventEmitter<void>();
  @Input() gameName!: string;
  @Input() gameBackground!: string;
  @Input() gameReleased!: string;
  @ViewChild('dateInput') dateInput!: ElementRef;

  startedAtISO: string = new Date().toISOString().split('T')[0];
  startedAtDisplay: string = '';

  notes: string = '';
  isLoading = false;
  errorMessage: string | null = null;

  private removeKeyListener!: () => void;
  private picker!: Litepicker;

  constructor(
    private playthroughService: PlaythroughService,
    private renderer: Renderer2,
  ) {}

  ngOnInit(): void {
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
      mobileFriendly: true,
      lang: 'es-ES',
      startDate: today,
    });

    const start = this.picker.getStartDate();
    if (start) {
      this.startedAtISO = start.format('YYYY-MM-DD'); // ISO para Supabase
      this.startedAtDisplay = start.format('DD MMM. YYYY'); // legible para mostrar
      this.dateInput.nativeElement.value = this.startedAtDisplay;
    }

    // Actualizar fechas al seleccionar
    this.picker.on('selected', (date) => {
      this.startedAtISO = date.format('YYYY-MM-DD'); // ISO
      this.startedAtDisplay = date.format('DD MMM. YYYY'); // legible
      this.dateInput.nativeElement.value = this.startedAtDisplay;
    });
  }

  async submit() {
    try {
      this.isLoading = true;
      this.errorMessage = null;

      // Guardar en Supabase
      await this.playthroughService.start(
        this.gameId,
        new Date(this.startedAtISO),
        this.gameName,
        this.gameBackground,
        this.gameReleased,
        this.notes || undefined,
      );

      this.started.emit();
      this.closed.emit();
    } catch (error: any) {
      this.errorMessage = error.message || 'Ocurrió un error al iniciar la partida.';
    } finally {
      this.isLoading = false;
    }
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
