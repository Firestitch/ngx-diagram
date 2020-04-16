import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FsDiagramDirective } from './directives/diagram/diagram.directive';
import { FsDiagramObjectDirective } from './directives/diagram-object/diagram-object.directive';
import { FsDiagramSourceDirective } from './directives/diagram-source/diagram-source.directive';


@NgModule({
  imports: [
    CommonModule,
  ],
  declarations: [
    FsDiagramDirective,
    FsDiagramObjectDirective,
    FsDiagramSourceDirective
  ],
  exports: [
    FsDiagramDirective,
    FsDiagramObjectDirective,
    FsDiagramSourceDirective
  ]
})
export class FsDiagramModule {}
