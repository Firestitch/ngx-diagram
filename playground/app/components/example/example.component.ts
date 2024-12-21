import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';

import {
  ConnectionAdded,
  ConnectionConfig,
  ConnectionEvent,
  ConnectorType,
  DiagramConfig,
  DiagramConnection,
  EndpointShape,
  FsDiagramDirective,
  FsDiagramObjectDirective,
} from '@firestitch/diagram';

import { Subject, takeUntil } from 'rxjs';

import { random } from 'lodash-es';


@Component({
  selector: 'example',
  templateUrl: './example.component.html',
  styleUrls: ['./example.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExampleComponent implements OnInit, OnDestroy {

  @ViewChild(FsDiagramDirective, { static: true })
  public diagram: FsDiagramDirective;

  public objects = [];
  public EndpointShape = EndpointShape;
  public scale = 1;
  public diagramConfig: DiagramConfig = {
    paintStyle: {
    },
  };

  private _cdRef = inject(ChangeDetectorRef);
  private _destroy$ = new Subject<void>();

  public ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  public ngOnInit() {
    this.diagramConfig = {};

    for (let i = 0; i <= 3; i++) {
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

  public add() {
    const x1 = random(0, 1000);
    const y1 = random(0, 500);
    const index = this.objects.length;
    const object = {
      name: `Object ${index + 1}`,
      x1,
      y1,
      id: index + 1,
      index,
    };

    this.objects.push(object);
    this._cdRef.markForCheck();
  }

  public get config(): ConnectionConfig {
    return {
      label: {
        content: 'Label',
      },
      tooltip: {
        content: 'Connection Tooltip',
      },
      click: () => {
        console.log('Connection clicked');
      },
      targetEndpoint: {
        shape: EndpointShape.Arrow,
      },
    };
  }

  public objectsAdded(diagramObjectDirectives: FsDiagramObjectDirective[]) {
    diagramObjectDirectives
      .forEach((diagramObjectDirective: FsDiagramObjectDirective) => {
        const previousObject = this.objects[diagramObjectDirective.data.index - 1];
        if(previousObject) {
          const diagramConnection = this.diagram
            .connect(previousObject, diagramObjectDirective.data, this.config); 

          this._updateDiagramConnection(diagramConnection);
        }
      });
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
        connection.setLabel({
          content: 'Updated Label',
        });
      });
  }

  public addExternal(object) {
    const config: ConnectionConfig = {
      label: {
        content: 'google.com',
      },
      targetEndpoint: {
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

  public _updateDiagramConnection(diagramConnection: DiagramConnection) {
    diagramConnection.setLabel({
      content: 'New Connection',
    });

    diagramConnection.setTooltip({
      content: 'New Connection Tooltip',
    });
    
    diagramConnection.setTargetEndpoint({
      shape: EndpointShape.Arrow,
    });

    diagramConnection.click$
      .pipe(
        takeUntil(this._destroy$),
      )
      .subscribe((e: ConnectionEvent) => {
        console.log('Connection clicked', e);
      });
  }

  public connectionAdded(event: ConnectionAdded) {
    console.log('connectionAdded', event);

    this._updateDiagramConnection(event.connection);
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
