import { ApplicationConfig, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerIntl } from '@angular/material/datepicker';
import { provideServiceWorker } from '@angular/service-worker';
import { routes } from './app.routes';

class EsDatepickerIntl extends MatDatepickerIntl {
  override prevMonthLabel       = 'Mes anterior';
  override nextMonthLabel       = 'Mes siguiente';
  override prevYearLabel        = 'Año anterior';
  override nextYearLabel        = 'Año siguiente';
  override prevMultiYearLabel   = 'Años anteriores';
  override nextMultiYearLabel   = 'Años siguientes';
  override switchToMonthViewLabel     = 'Elegir fecha';
  override switchToMultiYearViewLabel = 'Elegir mes y año';
}
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([jwtInterceptor, errorInterceptor])),
    provideAnimationsAsync(),
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'es-CO' },
    { provide: MatDatepickerIntl, useClass: EsDatepickerIntl },
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
