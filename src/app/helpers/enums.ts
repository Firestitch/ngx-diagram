export enum ConnectionOverlayType {
  Label = 'Label',
  Tooltip = 'Tooltip',
}

export enum ConnectorType {
  Elbow = 'Flowchart',
  Arch = 'StateMachine',
  Curve = 'Bezier',
  Straight = 'Straight'
}

export enum ConnectionActor {
  User,
  Api
}

export enum EndpointShape {
  Arrow = 'Arrow',
  PlainArrow = 'PlainArrow',
  Diamond = 'Diamond',
  Custom = 'Custom'
}
