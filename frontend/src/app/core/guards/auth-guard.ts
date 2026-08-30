import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { Api } from '../services/api';
import { AuthStore } from '../services/auth-store';
import { User } from '../models';

/** Permite accesul doar utilizatorilor autentificati. */
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthStore);
  const router = inject(Router);
  const api = inject(Api);

  if (auth.user()) return true;

  return api.get<User>('/auth/me').pipe(
    map((user) => {
      auth.user.set(user);
      auth.checked.set(true);
      return true;
    }),
    catchError(() => {
      auth.checked.set(true);
      return of(router.createUrlTree(['/autentificare'], { queryParams: { redirect: state.url } }));
    })
  );
};

/** Permite accesul doar proprietarilor de saloane. */
export const ownerGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthStore);
  const router = inject(Router);
  const api = inject(Api);

  const check = (user: User | null) => {
    if (!user) {
      return router.createUrlTree(['/autentificare'], { queryParams: { redirect: state.url } });
    }
    return user.role === 'owner' ? true : router.createUrlTree(['/contul-meu']);
  };

  if (auth.user()) return check(auth.user());

  return api.get<User>('/auth/me').pipe(
    map((user) => {
      auth.user.set(user);
      auth.checked.set(true);
      return check(user);
    }),
    catchError(() => {
      auth.checked.set(true);
      return of(check(null));
    })
  );
};
