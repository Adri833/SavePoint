import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Desplegable } from './desplegable';

describe('Desplegable', () => {
  let component: Desplegable;
  let fixture: ComponentFixture<Desplegable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Desplegable]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Desplegable);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
