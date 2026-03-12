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
  
  // Picker Map properties
  private pickerMap: L.Map | undefined;
  private pickerMarker: L.Marker | undefined;
  selectedLocation = signal<{lat: number, lng: number} | null>(null);
  userLocation = signal<{lat: number, lng: number} | null>(null);

  // Mini Maps properties
  private miniMaps = new Map<string, L.Map>();

  // Tabs et Sorting
  currentTab = signal<'all'|'favorites'>('all');
  sortBy = signal<'distance'|'recent'>('distance');

  constructor(
    private questionService: QuestionService,
    private authService: AuthService,
    private router: Router
  ) {
    // Écoute des changements sur les questions pour mettre à jour la carte principale et les mini-cartes
    effect(() => {
      const qs = this.questions();
      const loc = this.userLocation(); // Added here so the effect tracking is explicitly aware of it
      this.updateMapMarkers(qs);
      
      // On utilise setTimeout car le *ngFor doit avoir le temps de rendre les div id="map-..."
      setTimeout(() => this.updateMiniMaps(qs), 100);
    });

    // Écoute des changements d'onglet et de tri
    effect(() => {
      const tab = this.currentTab();
      const sort = this.sortBy();
      // Quand l'onglet ou le tri change, on recharge la liste depuis le serveur
      // On utilise les coordonnées connues si disponibles
      const loc = this.userLocation();
      this.loadQuestions(loc ? loc.lat : undefined, loc ? loc.lng : undefined);
    }, { allowSignalWrites: true });

    // Écoute l'ouverture du formulaire pour initialiser la carte de sélection (Picker)
    effect(() => {
      if (this.showForm()) {
        setTimeout(() => this.initPickerMap(), 100); // setTimeout pour laisser Angular instancier la div
      } else {
        this.destroyPickerMap();
      }
    });
  }

  ngOnInit() {
    this.currentUser.set(this.authService.getCurrentUser());
    this.initMap(33.5731, -7.5898);
    // Le chargement initial est géré par l'effect() sur currentTab / sortBy
    
    // Tente de récupérer la position une seule fois au démarrage pour centrer la carte principale
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (this.map) this.map.setView([pos.coords.latitude, pos.coords.longitude], 12);
          this.userLocation.set({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          this.loadQuestions(pos.coords.latitude, pos.coords.longitude);
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
      );
    }
  }

  ngOnDestroy() {
    if (this.map) this.map.remove();
    this.destroyPickerMap();
  }

  private destroyPickerMap() {
    if (this.pickerMap) {
      this.pickerMap.remove();
      this.pickerMap = undefined;
      this.pickerMarker = undefined;
    }
  }

  private initPickerMap() {
    // Utilise la position GPS exacte si connue, sinon le centre de la carte principale ou Casa par défaut
    const userLoc = this.userLocation();
    const defaultCenter = userLoc ? userLoc : (this.map ? this.map.getCenter() : { lat: 33.5731, lng: -7.5898 });
    
    this.pickerMap = L.map('picker-map').setView([defaultCenter.lat, defaultCenter.lng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(this.pickerMap);

    // Ajoute un marqueur déplaçable
    this.pickerMarker = L.marker([defaultCenter.lat, defaultCenter.lng], { draggable: true }).addTo(this.pickerMap);
    this.selectedLocation.set({ lat: defaultCenter.lat, lng: defaultCenter.lng });

    // Met à jour les coordonnées quand on déplace le marqueur
    this.pickerMarker.on('dragend', () => {
      const pos = this.pickerMarker!.getLatLng();
      this.selectedLocation.set({ lat: pos.lat, lng: pos.lng });
    });

    // Déplace le marqueur quand on clique sur la carte
    this.pickerMap.on('click', (e: L.LeafletMouseEvent) => {
      this.pickerMarker!.setLatLng(e.latlng);
      this.selectedLocation.set({ lat: e.latlng.lat, lng: e.latlng.lng });
    });
    
    // Invalider la taille aide Leaflet à bien s'afficher après l'animation ngIf
    setTimeout(() => this.pickerMap?.invalidateSize(), 150);
  }

  private initMap(lat: number, lng: number) {
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
    this.markers.forEach(marker => marker.remove());
    this.markers.clear();
    const usedCoords: { [key: string]: number } = {};

    // 1. Ajouter le marqueur rouge pour la position de l'utilisateur
    const userLoc = this.userLocation();
    if (userLoc) {
      const redIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });

      const userMarker = L.marker([userLoc.lat, userLoc.lng], { icon: redIcon })
        .bindPopup(`<b>📍 Votre position actuelle</b>`)
        .addTo(this.map!);
      
      this.markers.set('user_location', userMarker);
    }

    // 2. Ajouter les marqueurs pour les questions
    questions.forEach(q => {
      if (q.latitude && q.longitude) {
        let lat = q.latitude;
        let lng = q.longitude;
        const coordKey = `${lat.toFixed(5)}_${lng.toFixed(5)}`;
        
        if (usedCoords[coordKey]) {
          const offsetCount = usedCoords[coordKey];
          lat += (Math.random() - 0.5) * 0.0005 * offsetCount;
          lng += (Math.random() - 0.5) * 0.0005 * offsetCount;
          usedCoords[coordKey]++;
        } else {
          usedCoords[coordKey] = 1;
        }

        const marker = L.marker([lat, lng])
          .bindPopup(`<b>${q.title}</b><br>${q.body.substring(0, 50)}...`)
          .addTo(this.map!);
        this.markers.set(q._id, marker);
      }
    });
  }

  private updateMiniMaps(questions: any[]) {
    // 1. Liste des IDs actuels pour savoir ce qu'on doit garder
    const currentQIds = new Set(questions.map(q => q._id));

    // 2. Nettoyer les mini-cartes des questions qui n'existent plus ou dont le conteneur a été détruit/recréé par Angular
    this.miniMaps.forEach((mapInstance, id) => {
      const mapContainer = document.getElementById(`map-${id}`);
      
      // Si la question n'existe plus, OU si le conteneur n'est plus dans le DOM,
      // OU si Angular a recréé la <div id="..."> (node HTML différent)
      if (!currentQIds.has(id) || !mapContainer || mapInstance.getContainer() !== mapContainer) {
        mapInstance.remove();
        this.miniMaps.delete(id);
      }
    });

    // 3. Créer ou mettre à jour les mini-cartes
    questions.forEach(q => {
      if (q.latitude && q.longitude) {
        const mapId = `map-${q._id}`;
        const mapContainer = document.getElementById(mapId);
        
        // Si le conteneur HTML existe et que la carte n'est pas encore initialisée
        if (mapContainer && !this.miniMaps.has(q._id)) {
          // On crée une carte Leaflet statique (sans zoom/drag)
          const miniMap = L.map(mapId, {
            zoomControl: false,
            dragging: false,
            scrollWheelZoom: false,
            doubleClickZoom: false,
            attributionControl: false
          }).setView([q.latitude, q.longitude], 15);

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19
          }).addTo(miniMap);

          L.marker([q.latitude, q.longitude]).addTo(miniMap);
          
          this.miniMaps.set(q._id, miniMap);
        }
      }
    });
  }

  loadQuestions(lat?: number, lng?: number) {
    if (this.currentTab() === 'favorites') {
      this.questionService.getFavorites().subscribe({
        next: (data) => this.questions.set(data),
        error: (err) => {
          if (err.status === 401) this.router.navigate(['/login']);
          else this.questions.set([]);
        }
      });
    } else {
      const sort = this.sortBy();
      this.questionService.getQuestions(lat, lng, sort).subscribe({
        next: (data) => this.questions.set(data),
        error: (err) => {
          if (err.status === 401) this.router.navigate(['/login']);
          else this.questions.set([]);
        }
      });
    }
  }

  postQuestion() {
    const q = this.newQuestion();
    const loc = this.selectedLocation();

    if (!q.title.trim() || !q.body.trim() || !loc) {
      alert("Veuillez remplir tous les champs et choisir une localisation.");
      return;
    }
    
    const data = { ...q, latitude: loc.lat, longitude: loc.lng };
    
    this.questionService.createQuestion(data).subscribe({
      next: (newQ) => {
        if (this.currentTab() === 'all') {
          this.questions.update(qs => [newQ, ...qs]);
        }
        this.newQuestion.set({ title: '', body: '' });
        this.showForm.set(false);
        if (this.map) {
          this.map.setView([loc.lat, loc.lng], 13);
        }
      }
    });
  }

  isOwner(question: any): boolean {
    const user = this.currentUser();
    return user && question.user && user.email === question.user.email;
  }

  deleteQuestion(questionId: string) {
    if (confirm('Voulez-vous vraiment supprimer cette question ?')) {
      this.questionService.deleteQuestion(questionId).subscribe({
        next: () => {
          // Retire la question du signal
           this.questions.update(qs => qs.filter(q => q._id !== questionId));
        }
      });
    }
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
        if (this.currentTab() === 'favorites') {
          // Si on est dans l'onglet favoris, on retire de la liste
          this.questions.update(qs => qs.filter(q => q._id !== question._id));
        } else {
          // Sinon on met juste à jour l'apparence
          this.questions.update(qs => qs.map(q => 
            q._id === question._id ? { ...q, liked: false, likes: (q.likes || []).slice(0, -1) } : q
          ));
        }
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
