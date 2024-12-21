
import { EndpointShape } from '../helpers/enums';

import {
  ConnectorArchConfig,
  ConnectorCurveConfig,
  ConnectorElbowConfig,
  ConnectorStraightConfig,
} from './connector-config';
import { HoverPaintStyleConfig } from './hover-paint-style-config';
import { PaintStyleConfig } from './paint-style-config';


export interface DiagramConfig {
  paintStyle?: PaintStyleConfig;
  hoverPaintStyle?: HoverPaintStyleConfig;
  targetEndpoint?: ConnectionEndpointConfig;
  connector?: ConnectorArchConfig | ConnectorElbowConfig | ConnectorCurveConfig | ConnectorStraightConfig
}

export interface ConnectionEndpointConfig {
  length?: number;
  width?: number;
  foldback?: number;
  location?: number;
  shape?: EndpointShape;
  direction?: number;
}
