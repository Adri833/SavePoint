import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecentPlatinum } from './recent-platinum';

describe('RecentPlatinum', () => {
  let component: RecentPlatinum;
  let fixture: ComponentFixture<RecentPlatinum>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecentPlatinum]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecentPlatinum);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
