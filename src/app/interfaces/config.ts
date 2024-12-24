import { DiagramConnection } from '../classes/diagram-connection';

import {
  ConnectorArchConfig,
  ConnectorCurveConfig,
  ConnectorElbowConfig,
  ConnectorStraightConfig,
} from './connector-config';
import { ConnectionEndpointConfig } from './diagram-config';


export interface ConnectionConfig {
  label?: ConnectionLabelConfig,
  click?: (event: ConnectionEvent) => void,
  data?: any;
  connector?: ConnectorArchConfig | ConnectorElbowConfig | ConnectorCurveConfig | ConnectorStraightConfig,
  tooltip?: ConnectionTooltipConfig,
  scope?: string,
  targetEndpoint?: ConnectionEndpointConfig,
  id?: string,
}

export interface ConnectionLabelConfig {
  content?: string,
}

export interface ConnectionTooltipConfig {
  content?: string,
}

export interface ConnectionEvent {
  connection: DiagramConnection,
  event: MouseEvent,
  data: any
}
