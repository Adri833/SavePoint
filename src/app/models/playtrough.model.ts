export type PlaythroughStatus = 'playing' | 'finished';

export interface Playthrough {
  // ---------- Info básica ----------
  id: string;
  user_id: string;
  game_id: number;
  status: PlaythroughStatus;
  hours: number;
  started_at: Date;
  ended_at: Date | null;
  completed: boolean;
  platinum: boolean;
  online?: boolean;
  notes: string | null;

  // ---------- Info de auditoría ----------
  created_at: Date;
  updated_at: Date;

  // ---------- Info del juego (desnormalizada) ----------
  game_name: string;
  game_background: string;
  game_slug?: string;
  game_released?: string | null;
}
