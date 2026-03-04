import { Component, EventEmitter, Input, Output, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Playthrough } from '../../../models/playtrough.model';
import { CloseButton } from '../close-button/close-button';
import { HistoryGameCard } from '../history-game-card/history-game-card';
import { EditPlaythroughModal } from '../edit-playthrough-modal/edit-playthrough-modal';
import { ActivePlaythroughCard } from '../active-playthrough-card/active-playthrough-card';
import { FinishPlaythroughModal } from '../finish-playthrough-modal/finish-playthrough-modal';

@Component({
  selector: 'app-playthrough-detail-modal',
  imports: [
    CommonModule,
    CloseButton,
    HistoryGameCard,
    EditPlaythroughModal,
    ActivePlaythroughCard,
    FinishPlaythroughModal,
  ],
  templateUrl: './playthrough-detail-modal.html',
  styleUrl: './playthrough-detail-modal.scss',
})
export class PlaythroughDetailModal {
  @Input() playthrough!: Playthrough;
  @Output() close = new EventEmitter<void>();
  @Output() finish = new EventEmitter<Playthrough>();
  @Output() deleted = new EventEmitter<void>();

  showEditModal = false;
  showFinishModal = false;

  @HostListener('document:keydown.escape', ['$event'])
  handleEscape(event: Event) {
    event.preventDefault();
    this.onClose();
  }

  onClose() {
    this.close.emit();
  }

  openFinishModal() {
    this.showFinishModal = true;
  }

  closeFinishModal() {
    this.showFinishModal = false;
  }

  onPlaythroughFinished(updated: Playthrough) {
    this.closeFinishModal();
    this.playthrough = { ...this.playthrough, ...updated };
    this.finish.emit(updated);
    this.close.emit();
  }

  openEditModal(pt: Playthrough) {
    this.playthrough = pt;
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
  }

  onPlaythroughUpdated(updated: Playthrough) {
    if (this.playthrough?.id === updated.id) {
      this.playthrough = { ...this.playthrough, ...updated };
    }
    this.closeEditModal();
    this.close.emit();
    this.finish.emit(updated);
  }

  onPlaythroughDeleted() {
    this.closeEditModal();
    this.close.emit();
    this.deleted.emit();
  }

  formatDate(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
