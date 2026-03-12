import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class QuestionService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  // Récupérer les questions (triées par distance ou date)
  getQuestions(lat?: number, lng?: number, sort: 'distance' | 'recent' = 'distance'): Observable<any[]> {
    let params = new HttpParams().set('sort', sort);
    if (lat && lng) {
      params = params.set('lat', lat.toString()).set('lng', lng.toString());
    }
    return this.http.get<any[]>(`${this.apiUrl}/questions`, { params });
  }

  // Récupérer uniquement les favoris de l'utilisateur
  getFavorites(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/questions/favorites`);
  }

  // Poster une nouvelle question
  createQuestion(data: { title: string; body: string; latitude: number; longitude: number }): Observable<any> {
    return this.http.post(`${this.apiUrl}/questions`, { question: data });
  }

  // Ajouter une réponse à une question
  createAnswer(questionId: string, body: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/questions/${questionId}/answers`, { answer: { body } });
  }

  // Liker une question
  likeQuestion(questionId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/questions/${questionId}/like`, {});
  }

  // Unliker une question
  unlikeQuestion(questionId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/questions/${questionId}/unlike`);
  }

  deleteQuestion(questionId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/questions/${questionId}`);
  }
}
