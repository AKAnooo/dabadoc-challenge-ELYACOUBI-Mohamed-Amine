import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient, private router: Router) {}

  // Inscription : POST /signup
  signup(data: { email: string; password: string; latitude?: number; longitude?: number }): Observable<any> {
    return this.http.post(`${this.apiUrl}/signup`, { user: data }).pipe(
      tap((response: any) => {
        // On sauvegarde le token et les infos dans le localStorage
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
      })
    );
  }

  // Connexion : POST /login
  login(data: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, data).pipe(
      tap((response: any) => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
      })
    );
  }

  // Déconnexion : on efface le localStorage
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }

  // Est-ce que l'utilisateur est connecté ?
  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  // Récupérer les infos de l'utilisateur courant
  getCurrentUser(): any {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
}
