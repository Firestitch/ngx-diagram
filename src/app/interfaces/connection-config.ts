import { DiagramConnection } from '../classes/diagram-connection';

import {
  ConnectorArchConfig,
  ConnectorCurveConfig,
  ConnectorElbowConfig,
  ConnectorStraightConfig,
} from './connector-config';
import { DiagramSourceConfig } from './diagram-config';


export interface ConnectionConfig {
  label?: ConnectionLabelConfig,
  click?: (event: ConnectionEvent) => void,
  data?: any;
  connector?: ConnectorArchConfig | ConnectorElbowConfig | ConnectorCurveConfig | ConnectorStraightConfig,
  tooltip?: ConnectionTooltipConfig,
  name?: string
  point?: DiagramSourceConfig | boolean
  targetPoint?: DiagramSourceConfig | boolean
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
