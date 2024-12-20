import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';

import {
  ConnectionActor,
  ConnectionConfig,
  ConnectionCreated,
  ConnectionEvent,
  ConnectorType,
  DiagramConfig,
  DiagramConnection,
  FsDiagramDirective,
  FsDiagramObjectDirective,
  PointShape,
} from '@firestitch/diagram';

import { cloneDeep, random } from 'lodash-es';


@Component({
  selector: 'example',
  templateUrl: './example.component.html',
  styleUrls: ['./example.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExampleComponent implements OnInit {

  @ViewChild(FsDiagramDirective)
  public diagram: FsDiagramDirective;

  public objects = [];
  public PointShape = PointShape;
  public scale = 1;
  public startObject = {};
  public diagramConfig: DiagramConfig = {
    paintStyle: {
    },
  };

  private _cdRef = inject(ChangeDetectorRef);

  public ngOnInit() {
    this.diagramConfig = {};

    for (let i = 0; i < 2; i++) {
      this.add();
    }

    this._cdRef.markForCheck();
  }

  public remove(object) {
    this.objects = this.objects.filter((obj) => obj !== object);
  }

  public zoomed(scale) {
    this.scale = scale;
    this._cdRef.markForCheck();
  }

  public clone() {
    this.objects = cloneDeep(this.objects);
  }

  public add() {
    const x1 = random(0, 1000);
    const y1 = random(0, 500);
    const idx = this.objects.length;
    const object = { name: `Object ${idx + 1}`, x1, y1, id: idx + 1 };

    this.objects.push(object);
    this._cdRef.markForCheck();

    const config: ConnectionConfig = {
      name: `label-${idx}`,
      label: {
        content: `Label ${idx + 1}`,
      },
      tooltip: {
        content: 'Connection Tooltip',
      },
      click: () => {
        console.log('Connection clicked');
      },
    };
  }

  public diagramObjectsAdded(diagramObjects: FsDiagramObjectDirective[]) {
  }

  public repaint(data) {
    const directive = this.diagram.getDiagramObject(data);
    if (directive) {
      directive.repaint();
    }
  }

  public updateLabel(object) {
    this.diagram.getObjectConnections(object)
      .forEach((connection: DiagramConnection) => {
        connection.setLabelContent('Updated Label');
      });
  }

  public addExternal(object) {
    const config: ConnectionConfig = {
      label: {
        content: 'google.com',
      },
      targetPoint: {
        location: .15,
        direction: 1,
      },
      connector: {
        type: ConnectorType.Arch,
      },
      click: () => {
        (<any>window).location = 'http://google.com';
      },
    };

    this.diagram.connect(object, object, config);
  }

  public connectionCreated(event: ConnectionCreated) {

    console.log('connectionCreated', event);

    if (event.actor === ConnectionActor.User) {
      event.connection.setLabelContent('New Connection');
    }
  }

  public connectionLabelClick(e: ConnectionEvent) {
    console.log('Label clicked');
    e.connection.disconnect();
  }

  public objectDragStart(event) {
    console.log('objectDragStart', event);
  }

  public objectDragStop(event) {
    console.log('objectDragStop', event);
  }

  public objectClick(e: Event) {
    if (!e.defaultPrevented) {
      console.log('objectClick', e);
    }
  }
}
