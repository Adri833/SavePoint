export type FriendshipStatus = 'pending' | 'accepted' | 'rejected';

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: Date;
  updated_at: Date;
}

export interface FriendshipWithProfile extends Friendship {
  friend_id: string;
  friend_username: string;
  friend_avatar: string | null;
}