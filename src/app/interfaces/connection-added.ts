import { DiagramConnection } from '../classes/diagram-connection';
import { FsDiagramObjectDirective } from '../directives/diagram-object';


export interface ConnectionAdded {
  connection: DiagramConnection,
  target: FsDiagramObjectDirective,
  source: FsDiagramObjectDirective,
}
