import { DiagramConnection } from './../classes/diagram-connection';
import { ConnectionActor } from './../helpers/enums';


export interface ConnectionCreated {
  connection: DiagramConnection,
  target: any,
  source: any,
  actor: ConnectionActor
}
