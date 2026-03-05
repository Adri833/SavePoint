import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SearchService } from '../../../services/search.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  constructor(private searchService: SearchService) {}

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchService.setQuery(value.trim());
  }
}
