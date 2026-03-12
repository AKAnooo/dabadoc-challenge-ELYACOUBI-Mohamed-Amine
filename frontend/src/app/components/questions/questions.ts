import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { QuestionService } from '../../services/question';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-questions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './questions.html',
  styleUrl: './questions.scss'
})
export class QuestionsComponent implements OnInit {
  questions: any[] = [];
  showForm = false;
  newQuestion = { title: '', body: '' };
  answerBody: { [key: string]: string } = {};
  currentUser: any;

  constructor(
    private questionService: QuestionService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    
    // On charge les questions triées par distance automatiquement
    navigator.geolocation.getCurrentPosition(
      (pos) => this.loadQuestions(pos.coords.latitude, pos.coords.longitude),
      () => this.loadQuestions() // Si pas de GPS, on charge sans tri
    );
  }

  loadQuestions(lat?: number, lng?: number) {
    this.questionService.getQuestions(lat, lng).subscribe({
      next: (data) => this.questions = data,
      error: (err) => {
        // 401 = non connecté → login. Autres erreurs → liste vide
        if (err.status === 401) {
          this.router.navigate(['/login']);
        } else {
          this.questions = [];
        }
      }
    });
  }

  postQuestion() {
    if (!this.newQuestion.title.trim() || !this.newQuestion.body.trim()) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const data = {
          ...this.newQuestion,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        };
        this.questionService.createQuestion(data).subscribe({
          next: (q) => {
            this.questions.unshift(q);
            this.newQuestion = { title: '', body: '' };
            this.showForm = false;
          }
        });
      }
    );
  }

  postAnswer(questionId: string) {
    const body = this.answerBody[questionId];
    if (!body) return;
    this.questionService.createAnswer(questionId, body).subscribe({
      next: (answer) => {
        const question = this.questions.find(q => q._id === questionId);
        if (question) {
          question.answers = question.answers || [];
          question.answers.push(answer);
          this.answerBody[questionId] = '';
        }
      }
    });
  }

  toggleLike(question: any) {
    if (question.liked) {
      this.questionService.unlikeQuestion(question._id).subscribe(() => {
        question.liked = false;
      });
    } else {
      this.questionService.likeQuestion(question._id).subscribe(() => {
        question.liked = true;
      });
    }
  }

  logout() {
    this.authService.logout();
  }
}
