import { Injectable, NgZone } from '@angular/core';

import { jsPlumb } from 'jsplumb';

import { DiagramConfig } from './../interfaces/diagram-config';
import { DiagramConnection } from '../classes/diagram-connection';
import { FsDiagramObjectDirective } from './../directives/diagram-object/diagram-object.directive';


@Injectable()
export class DiagramService {

  public jsPlumb: any;
  public dragging = false;
  public diagramConfig: DiagramConfig;
  public diagramObjects = new Map<any, FsDiagramObjectDirective>();

  public constructor(public ngZone: NgZone) {
    this.jsPlumb = jsPlumb.getInstance();

    const on = this.jsPlumb.on;
    const zone = this.ngZone;
    const jsplumb = this.jsPlumb;

    this.jsPlumb.on = function() {
      const args = arguments;
      zone.runOutsideAngular(() => {
        on.apply(jsplumb, args);
      });
    };
  }

  public getConnection(source?: object, target?: object, name?: string): DiagramConnection {
    return this.getConnections(source, target, name)[0];
  }

  public getConnections(source?: object, target?: object, name?: string): DiagramConnection[] {

    let connections = []
    if (target || source) {

      name = name || '*';

      const sourceDiagram = source ? this.diagramObjects.get(source) : null;
      const targetDiagram = target ? this.diagramObjects.get(target) : null;

      if (targetDiagram && sourceDiagram) {
        connections = this.jsPlumb.getConnections({
          source: sourceDiagram.element.nativeElement,
          target: targetDiagram.element.nativeElement,
          scope: name
        });

        } else if (sourceDiagram) {
          connections = this.jsPlumb.getConnections({
            source: sourceDiagram.element.nativeElement,
            scope: name
          });

        } else if (targetDiagram) {
          connections = this.jsPlumb.getConnections({
            target: targetDiagram.element.nativeElement,
            scope: name
          });
        }

    } else if (name) {
      connections = this.jsPlumb.getConnections({
        scope: name
      });
    } else {
      connections = this.jsPlumb.getAllConnections();
    }

    return connections.map(connection => {
      const config = (connection.getData() || {})['connection-config'];
      return new DiagramConnection(this, connection, config);
    });
  }
}
