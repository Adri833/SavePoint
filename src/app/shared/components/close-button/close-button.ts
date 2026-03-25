import { Component, EventEmitter, Input, Output } from '@angular/core';

export type CloseButtonSize = 'small' | 'medium' | 'large';

@Component({
  selector: 'app-close-button',
  imports: [],
  templateUrl: './close-button.html',
  styleUrl: './close-button.scss',
})
export class CloseButton {
  @Input() size: CloseButtonSize = 'medium';
  @Output() close = new EventEmitter<void>();

  onClose() {
    this.close.emit();
  }
}
