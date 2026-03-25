import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  OnDestroy,
  Renderer2,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Profile, UpdateProfilePayload } from '../../../models/profile.model';
import { ProfileService } from '../../../services/profile.service';

@Component({
  selector: 'app-edit-profile-modal',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './edit-profile-modal.html',
  styleUrl: './edit-profile-modal.scss',
})
export class EditProfileModal implements OnInit, OnDestroy {
  @Input() profile!: Profile;
  @Output() closed = new EventEmitter<void>();
  @Output() updated = new EventEmitter<Profile>();

  @ViewChild('bioTextarea') bioTextarea!: ElementRef<HTMLTextAreaElement>;

  username = '';
  bio = '';
  avatarUrl = '';

  isLoading = false;
  errorMessage: string | null = null;

  private removeKeyListener!: () => void;

  constructor(
    private profileService: ProfileService,
    private renderer: Renderer2,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.username = this.profile.username;
    this.bio = this.profile.bio ?? '';
    this.avatarUrl = this.profile.avatar_url ?? '';

    this.renderer.setStyle(document.body, 'overflow', 'hidden');

    this.removeKeyListener = this.renderer.listen('window', 'keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape') this.close();
    });
  }

  autoResize(event: Event) {
    const el = event.target as HTMLTextAreaElement;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }

  // ========== SAVE ==========

  async save() {
    this.errorMessage = null;

    const payload: UpdateProfilePayload = {};

    if (this.username !== this.profile.username) payload.username = this.username;
    if (this.bio !== (this.profile.bio ?? '')) payload.bio = this.bio.trim() || null;
    if (this.avatarUrl !== (this.profile.avatar_url ?? ''))
      payload.avatar_url = this.avatarUrl.trim() || null;

    if (Object.keys(payload).length === 0) {
      this.close();
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();

    try {
      const updated = await this.profileService.updateProfile(payload);
      this.updated.emit(updated);
      this.close();
    } catch (err: any) {
      this.errorMessage = err.message ?? 'Error inesperado';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  // ========== HELPERS ==========

  get bioCharCount(): number {
    return this.bio.length;
  }

  get isFormDirty(): boolean {
    return (
      this.username !== this.profile.username ||
      this.bio !== (this.profile.bio ?? '') ||
      this.avatarUrl !== (this.profile.avatar_url ?? '')
    );
  }

  close() {
    this.closed.emit();
  }

  ngOnDestroy(): void {
    this.renderer.removeStyle(document.body, 'overflow');
    if (this.removeKeyListener) this.removeKeyListener();
  }
}
