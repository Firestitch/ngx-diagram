import { Subject, BehaviorSubject } from 'rxjs';
import {
  Directive,
  ElementRef,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  Output,
  OnDestroy,
  NgZone,
  AfterViewInit
} from '@angular/core';
import { uniq } from 'lodash-es';
import { FsDiagramDirective } from '../diagram/diagram.directive';
import { DiagramConnection } from '../../classes';


@Directive({
  selector: '[fsDiagramObject]'
})
export class FsDiagramObjectDirective implements OnDestroy, AfterViewInit {

  private _jsPlumb: any;
  private _mouseDownEvent: any;
  private _mouseUpEvent: any;

  @Input() maxTargetConnections = 0;
  @Input() maxSourceConnections = 0;
  @Input() selfTargetable = true;
  @Input() targetable = true;

  @HostBinding('class.fs-diagram-object') classDiagramObject = true;

  @Input()
  @HostBinding('style.top.px') y1: number;

  @Input()
  @HostBinding('style.left.px') x1: number;

  @Input()
  @HostBinding('class.draggable') draggable = true;

  @HostListener('click', ['$event'])
  onClick(e) {
    const xDelta = Math.abs(this._mouseDownEvent.screenX - this._mouseUpEvent.screenX);
    const yDelta = Math.abs(this._mouseDownEvent.screenY - this._mouseUpEvent.screenY);

    if (xDelta > 1 || yDelta > 1) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(e) {
    this._mouseDownEvent = e;
  }

  @HostListener('mouseup', ['$event'])
  onMouseUp(e) {
    this._mouseUpEvent = e;
  }

  @Output() dragStop = new EventEmitter<any>();
  @Output() dragStart = new EventEmitter<any>();
  @Input() data;
  @Input() scale = 1;

  public initalized$ = new BehaviorSubject(false);

  private _diagramDirective: FsDiagramDirective;

  constructor(private _element: ElementRef,
              private _ngZone: NgZone) {}

  get element(): ElementRef {
    return this._element;
  }

  public ngAfterViewInit() {
    setTimeout(() => {
      this.initalized$.next(true);
      this.initalized$.complete();
    });
  }

  public init(jsPlumb, diagramDirective: FsDiagramDirective) {

    if (this._jsPlumb) {
      return;
    }

    this._ngZone.runOutsideAngular(() => {

      this._diagramDirective = diagramDirective;
      this.element.nativeElement.fsDiagramObjectDirective = this;
      this._jsPlumb = jsPlumb;

      if (this.draggable) {
        this._jsPlumb.draggable([this.element.nativeElement],
          {
            start: (e) => {
              this.dragStart.emit(e);
              this._jsPlumb.setZoom(this.scale);
            },
            stop: e => {
              const x1 = e.pos[0];
              const y1 = e.pos[1];
              this.dragStop.emit({ event: e, data: this.data, x1: x1, y1: y1 });
            }
          });
      }

      this._jsPlumb.makeSource(this.element.nativeElement, {
        filter: '.fs-diagram-source'
      });

      if (this.targetable || this.selfTargetable) {
        this._jsPlumb.makeTarget(this.element.nativeElement, {
          allowLoopback: this.selfTargetable
        });

        this._jsPlumb.bind('connection', (info: any, e: Event) => {

          if (e) {

            if (info.target === this.element.nativeElement) {

              if (this.maxTargetConnections) {
                const connections = this._jsPlumb.getConnections({
                  target: info.target
                });

                if (this.maxTargetConnections < connections.length) {
                  setTimeout(() => {
                    this._jsPlumb.deleteConnection(info.connection);
                  });
                  e.preventDefault();
                }
              }

              if (this.maxSourceConnections) {
                const connections = this._jsPlumb.getConnections({
                  source: info.source
                });

                if (this.maxSourceConnections < connections.length) {
                  setTimeout(() => {
                    this._jsPlumb.deleteConnection(info.connection);
                  });
                  e.preventDefault();
                }
              }
            }
          }
        }, true);
      }
    });
  }

  public repaint() {
    this._jsPlumb.revalidate(this.element.nativeElement);
  }

  public ngOnDestroy() {

    uniq(
        this._diagramDirective.getConnections(null, this.data)
        .concat(this._diagramDirective.getConnections(this.data))
    )
    .forEach((conn: DiagramConnection) => {
      conn.disconnect();
    });

    this._jsPlumb.unmakeTarget(this.element.nativeElement);
  }
}
