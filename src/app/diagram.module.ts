import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { FsDiagramObjectDirective } from './directives/diagram-object/diagram-object.directive';
import { FsDiagramSourceDirective } from './directives/diagram-source/diagram-source.directive';
import { FsDiagramDirective } from './directives/diagram/diagram.directive';


@NgModule({
  imports: [
    CommonModule,
    FsDiagramDirective,
    FsDiagramObjectDirective,
    FsDiagramSourceDirective,
  ],
  exports: [
    FsDiagramDirective,
    FsDiagramObjectDirective,
    FsDiagramSourceDirective,
  ],
})
export class FsDiagramModule {}
