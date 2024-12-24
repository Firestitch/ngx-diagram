import {
  Directive,
  ElementRef,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';

import { guid } from '@firestitch/common';

import { BehaviorSubject, Observable } from 'rxjs';

import {
  BrowserJsPlumbInstance, ConnectionDragSelector, DragStartPayload, DragStopPayload,
  EVENT_DRAG_START, EVENT_DRAG_STOP,
} from '@jsplumb/browser-ui';

import { DiagramConnection } from '../../classes/diagram-connection';
import { FsDiagramDirective } from '../diagram/diagram.directive';


@Directive({
  selector: '[fsDiagramObject]',
})
export class FsDiagramObjectDirective implements OnDestroy, OnInit {

  @Input() public data;
  @Input() public scale = 1;
  @Input() public id: string;
  @Input() public selfTargetable = true;
  @Input() public targetable = true;

  @Input()
  @HostBinding('style.top.px') public y1: number;

  @Input()
  @HostBinding('style.left.px') public x1: number;

  @Input()
  @HostBinding('class.draggable') public draggable = true;

  @Output() 
  public dragStop = new EventEmitter<{ 
    event: DragStopPayload, data: any, x1: number, y1: number 
  }>();

  @Output() 
  public dragStart = new EventEmitter<{ 
    event: DragStartPayload 
  }>();

  @HostBinding('class.fs-diagram-object') 
  public classDiagramObject = true;

  @HostBinding('attr.id') 
  public attrId = `diagram-object-${guid()}`;
  
  private _connectionDragSelector: ConnectionDragSelector;
  private _mouseDownEvent;
  private _mouseUpEvent;
  private _initalized$ = new BehaviorSubject<boolean>(false);

  constructor(
    private _element: ElementRef,
    private _diagram: FsDiagramDirective,
  ) {}

  @HostListener('click', ['$event'])
  public onClick(e) {
    const xDelta = Math.abs(this._mouseDownEvent.screenX - this._mouseUpEvent.screenX);
    const yDelta = Math.abs(this._mouseDownEvent.screenY - this._mouseUpEvent.screenY);

    if (xDelta > 1 || yDelta > 1) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  @HostListener('mousedown', ['$event'])
  public onMouseDown(e) {
    this._mouseDownEvent = e;
  }

  @HostListener('mouseup', ['$event'])
  public onMouseUp(e) {
    this._mouseUpEvent = e;
  }

  public get initalized$(): Observable<boolean> {
    return this._initalized$.asObservable();
  }

  public get initalized(): boolean {
    return this._initalized$.getValue();
  }

  public get elementRef(): ElementRef {
    return this._element;
  }

  public ngOnInit() {
    this._diagram.diagramObjects.set(this.data, this);
  }

  public get jsPlumb(): BrowserJsPlumbInstance {
    return this._diagram.jsPlumb;
  }

  public get el(): HTMLElement {
    return this.elementRef.nativeElement;
  }
  
  public repaint() {
    this.jsPlumb.revalidate(this.el);
  }

  public ngOnDestroy() {
    this._diagram.getObjectConnections(this.data)
      .forEach((conn: DiagramConnection) => {
        conn.disconnect();
      });

    this._diagram.diagramObjects.delete(this.data);
    this.jsPlumb.removeSourceSelector(this._connectionDragSelector);
  }

  public init() {
    if (this.draggable) {
      this.jsPlumb.bind(EVENT_DRAG_START, (e: DragStartPayload) => {
        if(e.el.isEqualNode(this.el)) {
          this.dragStart.emit({ event: e });
          this.jsPlumb.setZoom(this.scale);
          this._diagram.dragging = true;
        }
      }); 
      
      this.jsPlumb.bind(EVENT_DRAG_STOP, (e: DragStopPayload) => {
        if(e.el.isEqualNode(this.el)) {
          const x1 = e.elements[0].pos.x;
          const y1 = e.elements[0].pos.y;
          this.dragStop.emit({ event: e, data: this.data, x1, y1 });
          this._diagram.dragging = false;
        }
      }); 
    } 

    this._connectionDragSelector = this.jsPlumb.addSourceSelector(this.selector);
    this.jsPlumb.addEndpoint(this.el, {
      ...this._diagram.defaultConfig,
      source: true,
    });

    if (this.targetable || this.selfTargetable) {
      this.jsPlumb.addTargetSelector(`#${this.attrId}`);
    }
  }

  public get selector(): string {
    return `#${this.attrId} [fsDiagramSource]`;
  }
}
