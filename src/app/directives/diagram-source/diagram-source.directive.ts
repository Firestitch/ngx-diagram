import { Directive, HostBinding, Input, OnInit } from '@angular/core';


@Directive({
  selector: '[fsDiagramSource]',
})
export class FsDiagramSourceDirective implements OnInit {

  @Input() public placement: string;

  @HostBinding('class') public class: string;

  public ngOnInit() {
    this.class = `fs-diagram-source ${this.placement}`;
  }

}
