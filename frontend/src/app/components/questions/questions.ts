import { Component, OnInit, signal, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { QuestionService } from '../../services/question';
import { AuthService } from '../../services/auth';
import * as L from 'leaflet';

@Component({
  selector: 'app-questions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './questions.html',
  styleUrl: './questions.scss'
})
export class QuestionsComponent implements OnInit, OnDestroy {
  questions = signal<any[]>([]);
  showForm = signal(false);
  newQuestion = signal({ title: '', body: '' });
  answerBody = signal<{ [key: string]: string }>({});
  currentUser = signal<any>(null);

  // Map properties
  private map: L.Map | undefined;
  private markers = new Map<string, L.Marker>();

  constructor(
    private questionService: QuestionService,
    private authService: AuthService,
    private router: Router
  ) {
    // Les Signals ont une fonction 'effect' très puissante.
    // À chaque fois que le signal 'questions' change, cette fonction repasse automatiquement !
    effect(() => {
      this.updateMapMarkers(this.questions());
    });
  }

  ngOnInit() {
    this.currentUser.set(this.authService.getCurrentUser());
    
    // Initialisation de la carte par défaut (sur Casablanca, Maroc)
    this.initMap(33.5731, -7.5898);

    this.loadQuestions();
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          // On centre la carte sur l'utilisateur
          if (this.map) {
            this.map.setView([pos.coords.latitude, pos.coords.longitude], 12);
          }
          this.loadQuestions(pos.coords.latitude, pos.coords.longitude);
        },
        () => {} 
      );
    }
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap(lat: number, lng: number) {
    // Fix pour les icones de Leaflet qui ne chargent pas bien avec Angular
    const iconRetinaUrl = 'assets/marker-icon-2x.png';
    const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
    const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';
    const DefaultIcon = L.icon({
      iconUrl, iconRetinaUrl, shadowUrl,
      iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
    });
    L.Marker.prototype.options.icon = DefaultIcon;

    this.map = L.map('map').setView([lat, lng], 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(this.map);
  }

  private updateMapMarkers(questions: any[]) {
    if (!this.map) return;

    // Supprimer les anciens marqueurs
    this.markers.forEach(marker => marker.remove());
    this.markers.clear();

    // Ajouter les nouveaux
    questions.forEach(q => {
      if (q.latitude && q.longitude) {
        const marker = L.marker([q.latitude, q.longitude])
          .bindPopup(`<b>${q.title}</b><br>${q.body.substring(0, 50)}...`)
          .addTo(this.map!);
        this.markers.set(q._id, marker);
      }
    });
  }

  loadQuestions(lat?: number, lng?: number) {
    this.questionService.getQuestions(lat, lng).subscribe({
      next: (data) => this.questions.set(data),
      error: (err) => {
        if (err.status === 401) this.router.navigate(['/login']);
        else this.questions.set([]);
      }
    });
  }

  postQuestion() {
    const q = this.newQuestion();
    if (!q.title.trim() || !q.body.trim()) return;
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const data = {
          ...q,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        };
        this.questionService.createQuestion(data).subscribe({
          next: (newQ) => {
            this.questions.update(qs => [newQ, ...qs]);
            this.newQuestion.set({ title: '', body: '' });
            this.showForm.set(false);
          }
        });
      }
    );
  }

  postAnswer(questionId: string) {
    const currentAnswers = this.answerBody();
    const body = currentAnswers[questionId];
    if (!body) return;
    
    this.questionService.createAnswer(questionId, body).subscribe({
      next: (answer) => {
        this.questions.update(qs => qs.map(q => 
          q._id === questionId ? { ...q, answers: [...(q.answers || []), answer] } : q
        ));
        this.answerBody.update(ab => ({ ...ab, [questionId]: '' }));
      }
    });
  }

  updateNewQuestion(field: 'title'|'body', value: string) {
    this.newQuestion.update(q => ({ ...q, [field]: value }));
  }

  updateAnswerBody(questionId: string, value: string) {
    this.answerBody.update(ab => ({ ...ab, [questionId]: value }));
  }

  toggleLike(question: any) {
    if (question.liked) {
      this.questionService.unlikeQuestion(question._id).subscribe(() => {
        this.questions.update(qs => qs.map(q => 
          q._id === question._id ? { ...q, liked: false, likes: (q.likes || []).slice(0, -1) } : q
        ));
      });
    } else {
      this.questionService.likeQuestion(question._id).subscribe(() => {
        this.questions.update(qs => qs.map(q => 
          q._id === question._id ? { ...q, liked: true, likes: [...(q.likes || []), { id: 'temp' }] } : q
        ));
      });
    }
  }

  logout() {
    this.authService.logout();
  }
}
