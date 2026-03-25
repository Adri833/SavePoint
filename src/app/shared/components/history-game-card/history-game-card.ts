import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Playthrough } from '../../../models/playtrough.model';
import { getPlaythroughState } from '../../../utils/playthrough-state';

@Component({
  selector: 'app-history-game-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history-game-card.html',
  styleUrls: ['./history-game-card.scss'],
})
export class HistoryGameCard {
  private _playthroughs: Playthrough[] = [];

  @Input()
  set pastPlaythroughs(value: Playthrough[] | Playthrough) {
    this._playthroughs = Array.isArray(value) ? value : [value];
  }
  get pastPlaythroughs(): Playthrough[] {
    return this._playthroughs;
  }

  @Output() editPlaythrough = new EventEmitter<Playthrough>();

  getState = getPlaythroughState;

  onEdit(pt: Playthrough) {
    this.editPlaythrough.emit(pt);
  }
}
