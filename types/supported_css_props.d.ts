interface DrawStyles {
  width: NOS
  height: NOS
  top: NOS
  left: NOS
  right: NOS
  bottom: NOS
  background: string
  position: 'relative' | 'absolute' | 'static'
  'z-index': number
  display: 'block' | 'flex' | 'inline-block' | 'inline-flex'
  'flex-direction': 'column' | 'row'
  flex: string
  'flex-wrap': 'wrap' | 'nowrap'
  'align-self': 'flex-start' | 'flex-end' | 'center' | 'stretch'
  'align-items': 'flex-start' | 'flex-end' | 'center' | 'stretch'
  'justify-content': 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around'
  'box-sizing': 'border-box' | 'content-box'
  'object-fit': 'contain' | 'cover'
  'border-radius': NOS
  'line-height': NOS
  'font-size': NOS
  'font-style': 'normal' | 'italic'
  'font-weight': NOS
  'text-align': 'center' | 'left' | 'right'
  'white-space': 'nowrap' | 'normal' | 'pre' | 'pre-line'
  'line-clamp': number
  'line-break': 'anywhere' | 'normal'
  overflow: 'hidden' | 'auto' | 'visible'
  color: string
  margin: NOS
  padding: NOS
  border: NOS
  'border-top': NOS
  'border-left': NOS
  'border-right': NOS
  'border-bottom': NOS
  'transform-origin': NOS
  transform: string
}
