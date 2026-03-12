import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // On lit le Token JWT depuis le stockage local du navigateur
  const token = localStorage.getItem('token');

  // Si un token existe, on l'ajoute à l'en-tête de chaque requête
  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(cloned);
  }

  // Sinon, on laisse passer la requête telle quelle (pour signup/login)
  return next(req);
};
