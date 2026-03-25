export interface PlaythroughState {
  cssClass: string;
  label: string;
}

export function getPlaythroughState(p: {
  status: string;
  completed: boolean;
  platinum: boolean;
  online?: boolean;
}): PlaythroughState {
  if (p.platinum) return { cssClass: 'platinum', label: '100%' };
  if (p.completed) return { cssClass: 'completed', label: 'Completado' };
  if (p.online) return { cssClass: 'online', label: 'Online' };
  if (p.status === 'playing') return { cssClass: 'playing', label: 'En curso' };
  return { cssClass: 'abandoned', label: 'Abandonado' };
}
