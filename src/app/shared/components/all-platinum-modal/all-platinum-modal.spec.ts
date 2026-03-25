import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllPlatinumModal } from './all-platinum-modal';

describe('AllPlatinumModal', () => {
  let component: AllPlatinumModal;
  let fixture: ComponentFixture<AllPlatinumModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllPlatinumModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllPlatinumModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
