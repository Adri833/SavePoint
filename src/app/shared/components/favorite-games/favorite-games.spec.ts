import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FavoriteGames } from './favorite-games';

describe('FavoriteGames', () => {
  let component: FavoriteGames;
  let fixture: ComponentFixture<FavoriteGames>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FavoriteGames]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FavoriteGames);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
