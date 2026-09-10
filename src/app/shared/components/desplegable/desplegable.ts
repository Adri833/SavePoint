import { Component, Input, Output, EventEmitter, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SelectOption<T = any> {
  label: string;
  value: T;
}

@Component({
  selector: 'app-desplegable',
  imports: [CommonModule],
  templateUrl: './desplegable.html',
  styleUrl: './desplegable.scss',
})
export class Desplegable<T = any> {
  @Input({ required: true }) options: SelectOption<T>[] = [];
  @Input() value!: T;
  @Input() placeholder: string = 'Seleccionar';
  @Input() disabled: boolean = false;
  @Input() maxHeight: boolean = false;

  @Output() valueChange = new EventEmitter<T>();

  isOpen = false;

  constructor(private elementRef: ElementRef) {}

  get selectedLabel(): string {
    const found = this.options.find((opt) => opt.value === this.value);
    return found ? found.label : this.placeholder;
  }

  toggleOpen(event: MouseEvent) {
    event.stopPropagation();
    if (this.disabled) return;
    this.isOpen = !this.isOpen;
  }

  selectOption(option: SelectOption<T>, event: MouseEvent) {
    event.stopPropagation();
    this.value = option.value;
    this.isOpen = false;
    this.valueChange.emit(this.value);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }
}
