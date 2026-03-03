import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GoogleButton } from './google-button';

describe('GoogleButton', () => {
  let component: GoogleButton;
  let fixture: ComponentFixture<GoogleButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GoogleButton]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GoogleButton);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
