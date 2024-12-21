

import {
  Connection, EVENT_CONNECTION_CLICK, EVENT_CONNECTION_MOUSEOUT,
  EVENT_CONNECTION_MOUSEOVER, LabelOverlay,
} from '@jsplumb/browser-ui';

import { FsDiagramDirective } from '../directives/diagram';
import { FsDiagramObjectDirective } from '../directives/diagram-object';
import { ConnectionOverlayType } from '../helpers/enums';
import {
  ConnectionConfig, ConnectionEvent, ConnectionLabelConfig,
  ConnectionTooltipConfig,
} from '../interfaces/config';
import { ConnectionEndpointConfig } from '../interfaces/diagram-config';

import {
  ConnectorArchConfig, ConnectorCurveConfig, ConnectorElbowConfig, ConnectorStraightConfig,
} from './../interfaces/connector-config';


export class DiagramConnection {

  public connection: Connection;

  private _diagram: FsDiagramDirective;
  private _config: ConnectionConfig = {};

  constructor( 
    diagram: FsDiagramDirective,
    connection: Connection,
  ) {
    this._diagram = diagram;
    this.connection = connection;
    this._config = connection.getData()['connection-config'] || {};
  }

  public get target(): FsDiagramObjectDirective {
    return Array.from(this._diagram.diagramObjects.values())
      .find((item: FsDiagramObjectDirective)=> {
        return item.el.isEqualNode(this.connection.target);
      });
  }

  public get source(): FsDiagramObjectDirective {
    return Array.from(this._diagram.diagramObjects.values())
      .find((item: FsDiagramObjectDirective)=> {
        return item.el.isEqualNode(this.connection.source);
      });
  }

  public get label(): ConnectionLabelConfig {
    return this._config.label || {};
  }

  public setClick(func: (event?: ConnectionEvent) => void) {
    this._config.click = func;
  }

  public setTargetEndpoint(endpoint: ConnectionEndpointConfig) {
    endpoint = { 
      ...this._diagram.config.targetEndpoint, 
      ...endpoint, 
    };

    const overlay: LabelOverlay = this.connection.getOverlay(this.targetEndpointId);
    if(overlay) {
      // TODO: Update overlay
    } else{
      this.connection
        .addOverlay({
          type: endpoint.shape,
          options: {
            foldback: endpoint.foldback,
            width: endpoint.width,
            length: endpoint.length,
            location: 1,
            direction: 1,
            id: this.targetEndpointId,
          },
        });
    }
  }

  public setLabel(config: ConnectionLabelConfig) {
    const overlay: LabelOverlay = this.connection.getOverlay(this.labelId);
    if(overlay) {
      overlay.setLabel(config.content);
    } else{
      let cssClass = 'fs-diagram-connection-label';
      if (this._config.click) {
        cssClass += ' fs-diagram-clickable';
      }

      this.connection
        .addOverlay({
          type: ConnectionOverlayType.Label,
          options: {
            label: config.content,
            cssClass: cssClass,
            id: this.labelId,
          },
        });
    }
  }
  
  public setTooltip(config: ConnectionTooltipConfig) {
    const overlay: LabelOverlay = this.connection.getOverlay(this.tooltipId);
    if(overlay) {
      overlay.setLabel(config.content);
    } else{
      this.connection
        .addOverlay({
          type: ConnectionOverlayType.Label,
          options: {
            label: config.content,
            cssClass: 'fs-diagram-connection-tooltip-overlay',
            id: this.tooltipId,
          },
        });
    }
  }

  public setConnector(
    connector:  ConnectorArchConfig | ConnectorElbowConfig | ConnectorCurveConfig | ConnectorStraightConfig,
  ) {
    connector = { ...this._diagram.config.connector, ...connector };
    this.connection.connector.type = connector.type;
  }

  public disconnect() {
    if (this.connection.endpoints) {
      this.connection.instance.deleteConnection(this.connection);
    }

    this.connection.removeAllOverlays();
    this.connection.unbind();
  }

  public get targetEndpointId() {
    return `target-endpoint-${this.connection.id}`;
  }

  public get labelId() {
    return `label-${this.connection.id}`;
  }

  public get tooltipId() {
    return `tooltip-${this.connection.id}`;
  }

  public render() {
    if (this._config.connector) {
      this.setConnector(this._config.connector);
    }

    this.connection.addClass('fs-diagram-connection');
    this.connection.scope = this._config.name;

    this._bindClickEvent();
    this._bindTooltip();
    this._bindTargetEndpoint();

    if (this._config.click) {
      this.connection.addClass('fs-diagram-clickable');
    }

    if (this._config.label) {
      this.setLabel(this._config.label);
    }
  }

  private _bindTargetEndpoint() {
    if(this._config.targetEndpoint) {
      this.setTargetEndpoint(this._config.targetEndpoint);
    }
  }

  private _bindTooltip() {
    if (!this._config.tooltip) {
      return;
    }

    this.connection.instance
      .bind(EVENT_CONNECTION_MOUSEOVER, (connection: Connection) => {
        if (connection === this.connection) {
          Object.values(connection.getOverlays())
            .forEach((overlay) => {
              const el = document.querySelector(`.jtk-overlay[jtk-overlay-id="${overlay.id}"]`);
              el?.classList.add('show');
            });
        }
      });

    this.connection.instance
      .bind(EVENT_CONNECTION_MOUSEOUT, (connection: Connection) => {
        if (connection === this.connection) {
          Object.values(connection.getOverlays())
            .forEach((overlay) => {
              const el = document.querySelector(`.jtk-overlay[jtk-overlay-id="${overlay.id}"]`);
            
              el?.classList.remove('show');
            });
        }
      });
 
    this.setTooltip(this._config.tooltip);
  }

  private _bindClickEvent() {
    this.connection.instance
      .bind(EVENT_CONNECTION_CLICK, (connection: Connection, event: PointerEvent) => {
        if(connection === this.connection) {
          const connectonEvent: ConnectionEvent = {
            data: connection.getData(),
            event,
            connection: this,
          };

          if (this._config.click) {
            this._config.click(connectonEvent);
          }
        }
      });
  }
}
