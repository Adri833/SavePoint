import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { supabase } from '../../../supabase.client';

@Component({
  standalone: true,
  selector: 'app-reset-password',
  imports: [CommonModule, FormsModule],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss',
})
export class ResetPassword {
  password: string = '';
  confirmPassword: string = '';
  error: string | null = null;
  success: string | null = null;
  loading = false;

  constructor(private router: Router, private cdr: ChangeDetectorRef) {}

  async reset() {
    if (this.loading) return;

    if (!this.password || !this.confirmPassword) {
      this.error = 'Por favor, completa todos los campos.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error = 'Las contraseñas no coinciden.';
      return;
    }

    if (this.password.length < 6) {
      this.error = 'La contraseña debe tener al menos 6 caracteres.';
      return;
    }

    this.loading = true;
    this.error = null;
    this.cdr.detectChanges();

    try {
      const { error } = await supabase.auth.updateUser({ password: this.password });
      if (error) throw error;

      this.success = '¡Contraseña actualizada! Redirigiendo...';
      this.cdr.detectChanges();

      setTimeout(() => this.router.navigate(['/login']), 2000);
    } catch (err: any) {
      this.error = 'Error al actualizar la contraseña. Inténtalo de nuevo.';
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }
}