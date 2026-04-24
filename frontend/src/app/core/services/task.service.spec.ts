import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TaskService } from './task.service';
import { environment } from '@env/environment';

describe('TaskService — HTTP', () => {
  let service: TaskService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TaskService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TaskService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('getTasks envia GET a /tasks con el parámetro familyId correcto', () => {
    service.getTasks(10).subscribe(tasks => {
      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toBe('Limpiar cocina');
    });

    const req = httpMock.expectOne(r =>
      r.url === `${environment.apiUrl}/tasks` && r.params.get('familyId') === '10'
    );
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 1, title: 'Limpiar cocina', status: 'PENDING' }]);
  });

  it('create envia POST a /tasks con el cuerpo de la solicitud', () => {
    const requestBody = {
      familyId: 10,
      homeSpaceId: 1,
      title: 'Limpiar cocina',
      description: 'Fregar el piso y limpiar la estufa',
      priority: 'MEDIA',
      xpReward: 20,
      coinsReward: 10,
    };

    service.create(requestBody as any).subscribe(task => {
      expect(task.id).toBe(99);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/tasks`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(requestBody);
    req.flush({ id: 99, title: 'Limpiar cocina' });
  });

  it('delete envia DELETE a la URL /tasks/:id correcta', () => {
    service.delete(5).subscribe(res => {
      expect(res.message).toBe('Tarea eliminada correctamente.');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/tasks/5`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'Tarea eliminada correctamente.' });
  });
});
