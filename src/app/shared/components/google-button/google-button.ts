import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-google-button',
  imports: [],
  templateUrl: './google-button.html',
  styleUrl: './google-button.scss',
})
export class GoogleButton {
  @Input() disabled = false;
  @Output() clicked = new EventEmitter<void>();
}
