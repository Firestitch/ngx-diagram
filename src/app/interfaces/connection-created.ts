import { FsDiagramObjectDirective } from './../directives/diagram-object/diagram-object.directive';
import { ConnectionActor } from './../helpers/enums';
import { DiagramConnection } from './../classes/diagram-connection';


export interface ConnectionCreated {
  connection: DiagramConnection,
  target: FsDiagramObjectDirective,
  source: FsDiagramObjectDirective,
  actor: ConnectionActor
}
