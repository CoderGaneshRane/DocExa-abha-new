import { TestBed } from '@angular/core/testing';

import { AbhaServicesService } from './abha-services.service';

describe('AbhaServicesService', () => {
  let service: AbhaServicesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AbhaServicesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
