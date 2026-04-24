import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { FamilyService } from './family.service';
import { environment } from '@env/environment';

describe('FamilyService — HTTP', () => {
  let service: FamilyService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FamilyService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(FamilyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('create envia POST a /families con el nombre de familia correcto', () => {
    service.create({ name: 'Familia García' }).subscribe(family => {
      expect(family.id).toBe(1);
      expect(family.name).toBe('Familia García');
      expect(family.role).toBe('PARENT');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/families`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: 'Familia García' });
    req.flush({ id: 1, name: 'Familia García', role: 'PARENT' });
  });

  it('getActivityLog envia GET a /families/:id/activity con parámetros de paginación', () => {
    service.getActivityLog(5, 0, 10).subscribe();

    const req = httpMock.expectOne(r =>
      r.url === `${environment.apiUrl}/families/5/activity` &&
      r.params.get('page') === '0' &&
      r.params.get('size') === '10'
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('removeMember envia DELETE a /families/:familyId/members/:userId', () => {
    service.removeMember(5, 99).subscribe(res => {
      expect(res.message).toBe('Miembro eliminado correctamente.');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/families/5/members/99`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'Miembro eliminado correctamente.' });
  });
});
