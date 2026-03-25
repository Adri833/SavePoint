import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserPlaythroughs } from './user-playthroughs';

describe('UserPlaythroughs', () => {
  let component: UserPlaythroughs;
  let fixture: ComponentFixture<UserPlaythroughs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserPlaythroughs]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserPlaythroughs);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
