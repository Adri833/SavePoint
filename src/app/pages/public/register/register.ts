import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { Logo } from '../../../shared/components/logo/logo';
import { InputFieldComponent } from '../../../shared/components/input-field/input-field';
import { GoogleButton } from "../../../shared/components/google-button/google-button";

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, Logo, InputFieldComponent, GoogleButton],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  email = '';
  password = '';
  error: string | null = null;
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  async register() {
    if (this.loading) return;

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

    this.loading = true;
    this.cdr.detectChanges();

    try {
      const { user, session } = await this.authService.register(this.email, this.password);

      if (!session) {
        this.error = 'Te hemos enviado un email de confirmación. Revísalo para activar tu cuenta.';
        return;
      }

      await this.router.navigate(['/home/biblioteca']);
    } catch (error: any) {
      this.error = this.mapRegisterError(error);
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

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private mapRegisterError(error: any): string {
    const message = error?.message?.toLowerCase() || '';

    if (message.includes('already registered')) {
      return 'Este email ya está registrado.';
    }

    if (message.includes('invalid email')) {
      return 'El formato del email no es válido.';
    }

    if (message.includes('password')) {
      return 'La contraseña no cumple los requisitos de seguridad.';
    }

    if (message.includes('network')) {
      return 'Error de conexión. Inténtalo de nuevo.';
    }

    return 'No se pudo crear la cuenta. Inténtalo más tarde.';
  }
}
