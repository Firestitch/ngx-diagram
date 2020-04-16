import {  ConnectorArchConfig, ConnectorElbowConfig,
          ConnectorCurveConfig, ConnectorStraightConfig } from './connector-config';
import { DiagramSourceConfig } from './diagram-config';
import { DiagramConnection } from '../classes/diagram-connection';


export interface ConnectionConfig {
  label?: ConnectionLabelConfig,
  click?: (event: ConnectionEvent) => void,
  data?: any;
  connector?: ConnectorArchConfig | ConnectorElbowConfig | ConnectorCurveConfig | ConnectorStraightConfig,
  tooltip?: ConnectionTooltipConfig,
  name?: string
  Point?: DiagramSourceConfig | boolean
  targetPoint?: DiagramSourceConfig | boolean
}

export interface ConnectionLabelConfig {
  content?: string,
  click?: (event: ConnectionEvent) => void,
  tooltip?: ConnectionTooltipConfig
}

export interface ConnectionTooltipConfig {
  content?: string,
}

export interface ConnectionEvent {
  connection: DiagramConnection,
  event: MouseEvent,
  data: any
}
