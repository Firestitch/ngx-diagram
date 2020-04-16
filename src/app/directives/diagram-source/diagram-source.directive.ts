import { Directive, Input, HostBinding, OnInit } from '@angular/core';


@Directive({
  selector: '[fsDiagramSource]'
})
export class FsDiagramSourceDirective implements OnInit {

  @Input() placement;

  @HostBinding('class') class: string;

  ngOnInit() {
    this.class = 'fs-diagram-source ' + this.placement;
  }

}
