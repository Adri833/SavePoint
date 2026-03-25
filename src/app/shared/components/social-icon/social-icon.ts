import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-social-icon',
  imports: [],
  templateUrl: './social-icon.html',
  styleUrl: './social-icon.scss',
})
export class SocialIcon {
  @Input() icon!: string;
  @Input() href!: string;
  @Input() label!: string;
  @Input() target: '_blank' | '_self' = '_blank';
  @Input() showLabel = false;
}
