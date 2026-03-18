import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ProfileService } from '../../../services/profile.service';
import { Logo } from '../../../shared/components/logo/logo';
import { InputFieldComponent } from '../../../shared/components/input-field/input-field';
import { GoogleButton } from '../../../shared/components/google-button/google-button';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, Logo, InputFieldComponent, GoogleButton],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  step = 1;

  email = '';
  password = '';
  username = '';
  error: string | null = null;
  loading = false;

  constructor(
    private authService: AuthService,
    private profileService: ProfileService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  // Paso 1 → 2: validación local, sin llamada a Supabase

  goToStep2() {
    this.error = null;

    if (!this.email || !this.password) {
      this.error = 'Por favor, completa todos los campos.';
      return;
    }

    if (!this.isValidEmail(this.email)) {
      this.error = 'Introduce un email válido.';
      return;
    }

    if (this.password.length < 6) {
      this.error = 'La contraseña debe tener al menos 6 caracteres.';
      return;
    }

    this.step = 2;
  }

  goBack() {
    this.error = null;
    this.step = 1;
  }

  // Paso 2: registra + actualiza perfil

  async register() {
    if (this.loading) return;

    this.error = null;

    const trimmed = this.username.trim();
    if (!trimmed) {
      this.error = 'El nombre de usuario no puede estar vacío.';
      return;
    }
    if (trimmed.length < 3) {
      this.error = 'El nombre de usuario debe tener al menos 3 caracteres.';
      return;
    }
    if (trimmed.length > 15) {
      this.error = 'El nombre de usuario no puede superar los 15 caracteres.';
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      this.error = 'Solo letras, números y guiones bajos.';
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    try {
      const available = await this.profileService.isUsernameAvailable(this.username.trim());
      if (!available) {
        this.error = 'Este nombre de usuario ya está en uso.';
        this.loading = false;
        this.cdr.detectChanges();
        return;
      }

      await this.authService.register(this.email, this.password);
      await this.profileService.updateProfile({ username: this.username.trim() });
      await this.router.navigate(['/home/playthroughs']);
    } catch (error: any) {
      await this.authService.logout();
      this.error = this.mapRegisterError(error);
      if (this.isStep1Error(error)) this.step = 1;
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async loginWithGoogle() {
    if (this.loading) return;
    this.loading = true;
    this.error = null;
    this.cdr.detectChanges();

    try {
      await this.authService.loginWithGoogle();
    } catch {
      this.error = 'Error al iniciar sesión con Google. Inténtalo de nuevo.';
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  // ── Helpers ──

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private isStep1Error(error: any): boolean {
    const msg = error?.message?.toLowerCase() ?? '';
    return (
      msg.includes('already registered') || msg.includes('invalid email') || msg.includes('network')
    );
  }

  private mapRegisterError(error: any): string {
    const message = error?.message?.toLowerCase() ?? '';

    if (message.includes('already registered')) return 'Este email ya está registrado.';
    if (message.includes('invalid email')) return 'El formato del email no es válido.';
    if (message.includes('password')) return 'La contraseña no cumple los requisitos de seguridad.';
    if (message.includes('network')) return 'Error de conexión. Inténtalo de nuevo.';
    if (message.includes('username')) return 'Este nombre de usuario ya está en uso.';

    return 'No se pudo crear la cuenta. Inténtalo más tarde.';
  }
}
