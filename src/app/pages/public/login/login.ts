import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { Logo } from '../../../shared/components/logo/logo';
import { InputFieldComponent } from '../../../shared/components/input-field/input-field';
import { GoogleButton } from '../../../shared/components/google-button/google-button';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, FormsModule, Logo, InputFieldComponent, GoogleButton],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  email: string = '';
  password: string = '';
  error: string | null = null;
  successMessage: string | null = null;
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  async login() {
    if (this.loading) return;

    this.error = null;

    if (!this.email || !this.password) {
      this.error = 'Por favor, completa todos los campos.';
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    try {
      await this.authService.login(this.email, this.password);
      await this.router.navigate(['/home/biblioteca']);
    } catch (error: any) {
      this.error = this.mapAuthError(error);
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
    } catch (error: any) {
      this.error = 'Error al iniciar sesión con Google. Inténtalo de nuevo.';
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async forgotPassword() {
    if (!this.email) {
      this.error = 'Introduce tu email primero para recuperar la contraseña.';
      this.cdr.detectChanges();
      return;
    }

    try {
      await this.authService.resetPassword(this.email);
      this.error = null;
      this.successMessage = 'Te hemos enviado un correo para recuperar tu contraseña.';
    } catch {
      this.error = 'Error al enviar el email de recuperación.';
    } finally {
      this.cdr.detectChanges();
    }
  }

  private mapAuthError(error: any): string {
    const message = error?.message?.toLowerCase() || '';

    if (message.includes('invalid login credentials')) {
      return 'Email o contraseña incorrectos';
    }

    if (message.includes('email not confirmed')) {
      return 'Debes confirmar tu email antes de entrar';
    }

    if (message.includes('network')) {
      return 'Error de conexión, inténtalo de nuevo';
    }

    return 'Error al iniciar sesión. Inténtalo más tarde.';
  }
}
