export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  is_public: boolean;
  created_at: Date;
}

export interface UpdateProfilePayload {
  username?: string;
  bio?: string | null;
  is_public?: boolean;
  avatar_url?: string | null;
}