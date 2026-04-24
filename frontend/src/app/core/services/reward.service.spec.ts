import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RewardService } from './reward.service';
import { environment } from '@env/environment';

describe('RewardService — HTTP', () => {
  let service: RewardService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RewardService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(RewardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('getRewards envia GET a /rewards con el parámetro familyId correcto', () => {
    service.getRewards(10).subscribe(rewards => {
      expect(rewards).toHaveLength(2);
      expect(rewards[0].name).toBe('Pizza');
    });

    const req = httpMock.expectOne(r => r.url === `${environment.apiUrl}/rewards`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('familyId')).toBe('10');
    req.flush([
      { id: 1, name: 'Pizza', cost: 100, familyId: 10 },
      { id: 2, name: 'Videojuego', cost: 300, familyId: 10 },
    ]);
  });

  it('update envia PATCH a /rewards/:id con el cuerpo de la solicitud', () => {
    const updateBody = { name: 'Nueva Pizza', description: null, icon: null, cost: 150, minLevel: null };

    service.update(1, updateBody).subscribe(reward => {
      expect(reward.name).toBe('Nueva Pizza');
      expect(reward.cost).toBe(150);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/rewards/1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(updateBody);
    req.flush({ id: 1, name: 'Nueva Pizza', cost: 150 });
  });
});
