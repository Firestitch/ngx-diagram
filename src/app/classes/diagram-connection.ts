import { ConnectorArchConfig, ConnectorElbowConfig, ConnectorCurveConfig, ConnectorStraightConfig } from './../interfaces/connector-config';
import { forOwn } from 'lodash-es';
import { FsDiagramDirective } from '../directives/diagram/diagram.directive';
import { ConnectionEvent, ConnectionLabelConfig } from '../interfaces/connection-config';
import { ConnectionOverlayType } from '../helpers/enums';
import { ConnectionConfig } from '../interfaces';


export class DiagramConnection {

  public connection;
  private _diagram;
  private _config: ConnectionConfig = {};

  public constructor(diagram: FsDiagramDirective, connection, config?: ConnectionConfig) {
    this._diagram = diagram;
    this.connection = connection;

    if (config) {
      this.config = config || {};
    }
  }

  public set config(value) {
    this._config = value;
    this.setData('connection-config', value);
  }

  public get config() {
    return this._config;
  }

  public setLabelContent(content) {
    if (!this.config.label) {
      this.config.label = {};
    }
    this.config.label.content = content;
    this.render();
  }

  public setLabel(label: ConnectionLabelConfig) {
    this.config.label = label;
    this.render();
  }

  public setConnector(connector:  ConnectorArchConfig | ConnectorElbowConfig |
                                  ConnectorCurveConfig | ConnectorStraightConfig) {
    connector = Object.assign({}, this._diagram.config.connector, connector);
    this.connection.setConnector([connector.type, connector ]);
  }

  public setData(name, value?) {
    const data = this.connection.getData() || {};
    data[name] = value;
    this.connection.setData(data);
  }

  public disconnect() {
    if (this.connection.endpoints) {
      this._diagram.jsPlumb.deleteConnection(this.connection);
    }
  }

  public render() {

    this.connection.removeAllOverlays();

    if (this.config.connector) {
      this.setConnector(this.config.connector);
    }

    if (this.config.data) {
      forOwn(this.config.data, (value, name) => {
        this.setData(name, value);
      });
    }

    this.connection.addClass('fs-diagram-connection');
    this.connection.scope = this.config.name;

    const tooltipId = 'tooltip_' + this.connection.id;
    const labelId = 'label_' + this.connection.id;

    this.connection.unbind('click');
    this.connection.unbind('mouseover');
    this.connection.unbind('mouseout');

    this.connection.addClass('fs-diagram-clickable');
    if (this.config.tooltip) {
      this.connection.bind('mouseover', (conn, event) => {
        const tip = document.querySelector(`.fs-diagram-connection-tooltip_${conn.id}`);
        if (tip) {

          if (conn.tooltipTimer) {
            clearInterval(conn.tooltipTimer);
          }

          tip.classList.add('show');
        }
      });

      this.connection.bind('mouseout', (conn, event) => {
        const tip = document.querySelector(`.fs-diagram-connection-tooltip_${conn.id}`);

        if (tip) {
          conn.tooltipTimer = setTimeout(() => {
            tip.classList.remove('show');
          }, 100);
        }
      });

      const label = `<div class="fs-diagram-connection-tooltip fs-diagram-connection-tooltip_` +
                    `${this.connection.id}">${this.config.tooltip.content}</div>`;

      this.connection.addOverlay([ConnectionOverlayType.Label,
        {
          label: label,
          id: tooltipId,
          cssClass: 'fs-diagram-connection-tooltip-overlay'
        }]);
    }

    this.connection.bind('click', (e, originalEvent) => {
      const event: ConnectionEvent = {
        data: this.connection.getData(),
        event: originalEvent,
        connection: this
      };

      if (e.type) {

        if (tooltipId === e.id) {
          // If the connection is clicked
          if (this.config.click) {
            this.config.click(event);
          }

        } else if (labelId === e.id) {
          // If the label is clicked
          if (this.config.label.click) {
            this.config.label.click(event);
          }
        }
      } else {
        // If the connection clicked
        if (this.config.click) {
          this.config.click(event);
        }
      }
    });

    if (this.config.label) {

      let cssClass = 'fs-diagram-connection-label';
      if (this.config.label.click) {
        cssClass += ' fs-diagram-clickable';
      }

      this.connection.addOverlay([ConnectionOverlayType.Label,
        {
          label: this._renderLabelContent(),
          cssClass: cssClass,
          id: labelId
        }]);
    }

    if (this._diagram.config.Point.shape) {
      this._addPoint(this._diagram.config.Point, this.config.Point, 'source');
    }

    if (this._diagram.config.targetPoint.shape) {
      this._addPoint(this._diagram.config.targetPoint, this.config.targetPoint, 'target');
    }
  }

  private _addPoint(defaultConfig, config, name) {
    const overlay = Object.assign(
      {},
      defaultConfig,
      {
        id: `${name}_${this.connection.id}`
      },
      config);

      this.connection.addOverlay([overlay.shape, overlay]);
  }

  private _renderLabelContent() {
    let label = this.config.label.content;

    if (this.config.label.tooltip) {
      label += '<div class="fs-diagram-connection-label-tooltip">' + this.config.label.tooltip.content + '</div>';
    }

    return label;
  }
}
