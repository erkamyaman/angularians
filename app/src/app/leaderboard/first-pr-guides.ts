import { Component } from '@angular/core'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { remixSparklingLine } from '@ng-icons/remixicon'

@Component({
  selector: 'app-first-pr-guides',
  imports: [NgIcon],
  providers: [provideIcons({ remixSparklingLine })],
  templateUrl: './first-pr-guides.html',
  styleUrl: './first-pr-guides.css',
})
export class FirstPrGuides {}
