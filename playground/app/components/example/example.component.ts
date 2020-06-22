import { FsDiagramDirective } from 'src/app/directives/diagram/diagram.directive';
import { DiagramConfig } from 'src/app/interfaces';
import { DiagramConnection } from 'src/app/classes';
import { Component, OnInit, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FsPrompt } from '@firestitch/prompt';
import { random, cloneDeep } from 'lodash-es';
import { ConnectionConfig, ConnectionEvent, ConnectionCreated } from 'src/app/interfaces';
import { ConnectionActor, ConnectorType } from 'src/app/helpers';


@Component({
  selector: 'example',
  templateUrl: 'example.component.html',
  styleUrls: ['example.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExampleComponent implements OnInit {

  @ViewChild(FsDiagramDirective, { static: true })
  public diagram: FsDiagramDirective;

  public objects = [];
  public startObject = {};
  public diagramConfig: DiagramConfig = {
    paintStyle: {
    }
  };

  constructor(private _prompt: FsPrompt,
              private _cdRef: ChangeDetectorRef) {}

  ngOnInit() {
    this.diagramConfig = {}

    setTimeout(() => {
      for (let i = 0; i < 15; i++) {
        this.add();
      }

      this._cdRef.markForCheck();
    }, 100);
  }

  remove(object) {
    this.objects = this.objects.filter(obj => obj !== object);
  }

  clone() {
    this.objects = cloneDeep(this.objects);
  }

  add() {

    const x1 = random(0, 1000);
    const y1 = random(0, 500);

    const idx = this.objects.length;

    const object = { name: 'Object ' + (idx + 1), x1: x1, y1: y1, id: idx + 1 };

    this.objects.push(object);

    const object2 = this.objects[this.objects.length - 1];
    const object1 = this.objects[this.objects.length - 2];

    if (!object1) {

      return this.diagram.connect(this.startObject, object2, {
        label: {
          content: 'Start'
        },
        click: () => {
          console.log('Connection Clicked');
        }
      });
    }

    const config: ConnectionConfig = {
      name: 'label-' + idx,
      label: {
        content: 'Label ' + (idx + 1),
        click: (event: ConnectionEvent) => {
          this.connectionLabelClick(event);
        },
        tooltip: {
          content: 'Tooltip that spans\nmultiple lines and support <br><b>HTML</b>'
        }
      },
      tooltip: {
        content: 'Connection Tooltip'
      },
      data: {
        object: object1
      },
      click: () => {
        console.log('Connection clicked');
      }
    };

    this.diagram.connect(object1, object2, config);

  }

  public initialized() {

    this.diagram.suspendRendering(() => {

      this.objects.forEach((object1, idx) => {


      });
    });
  }

  public repaint(data) {
    const directive = this.diagram.getDiagramObject(data);
    if (directive) {
      directive.repaint();
    }
  }

  public updateLabel(object) {

    this.diagram.getConnections(null, object)
    .forEach((connection: DiagramConnection) => {
      connection.setLabelContent('Updated Label');
    });
  }

  public addExternal(object) {
    const config: ConnectionConfig = {
      label: {
        content: 'google.com'
      },
      targetPoint: {
        location: .15,
        direction: 1
      },
      connector: {
        type: ConnectorType.Arch
      },
      click: (event: ConnectionEvent) => {
        (<any>window).location = 'http://google.com'
      }
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
    this._prompt.confirm({
      title: 'Confirm',
      template: 'Would you like to delete this connection?'
    }).subscribe(() => {

      e.connection.disconnect();
    });
  }

  public objectDragStart(e) {
    e.e.stopPropagation();
    console.log('objectDragStart', e);
  }

  public objectDragStop(e) {
    console.log('objectDragStop', e);
  }

  public objectClick(e: Event) {
    if (!e.defaultPrevented) {
      console.log('objectClick', e);
    }
  }
}
