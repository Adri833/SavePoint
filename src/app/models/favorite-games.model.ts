export interface FavoriteGame {
  id: string;
  user_id: string;
  game_id: number;
  game_name: string;
  game_cover: string | null;
  position: number;
  created_at: Date;
}

export interface AddFavoritePayload {
  game_id: number;
  game_name: string;
  game_cover: string | null;
  position: number;
}