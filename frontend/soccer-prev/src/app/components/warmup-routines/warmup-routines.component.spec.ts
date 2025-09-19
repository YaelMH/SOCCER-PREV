import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WarmupRoutinesComponent } from './warmup-routines.component';

describe('WarmupRoutinesComponent', () => {
  let component: WarmupRoutinesComponent;
  let fixture: ComponentFixture<WarmupRoutinesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WarmupRoutinesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WarmupRoutinesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
