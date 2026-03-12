import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.scss'
})
export class SignupComponent {
  email = '';
  password = '';
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    // On demande la position GPS au navigateur automatiquement !
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.authService.signup({
          email: this.email,
          password: this.password,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }).subscribe({
          next: () => this.router.navigate(['/questions']),
          error: (err) => {
            this.errorMessage = err.error?.errors?.join(', ') || 'Erreur lors de l\'inscription.';
          }
        });
      },
      () => {
        // Si l'utilisateur refuse la localisation, on s'inscrit sans coordonnées
        this.authService.signup({ email: this.email, password: this.password }).subscribe({
          next: () => this.router.navigate(['/questions']),
          error: (err) => {
            this.errorMessage = err.error?.errors?.join(', ') || 'Erreur lors de l\'inscription.';
          }
        });
      }
    );
  }
}
