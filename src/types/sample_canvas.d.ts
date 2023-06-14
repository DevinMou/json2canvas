declare namespace SampleCanvas {
  type ImageSource = SampleImage | Canvas
  interface CanvasTextDrawingStyles {
    direction: 'inherit' | 'ltr' | 'rtl'
    font: string
    fontKerning: 'auto' | 'none' | 'normal'
    textAlign: 'center' | 'end' | 'left' | 'right' | 'start'
    textBaseline: 'alphabetic' | 'bottom' | 'hanging' | 'ideographic' | 'middle' | 'top'
  }
  type CanvasFillRule = 'evenodd' | 'nonzero'
  type GlobalCompositeOperation = "color" | "color-burn" | "color-dodge" | "copy" | "darken" | "destination-atop" | "destination-in" | "destination-out" | "destination-over" | "difference" | "exclusion" | "hard-light" | "hue" | "lighten" | "lighter" | "luminosity" | "multiply" | "overlay" | "saturation" | "screen" | "soft-light" | "source-atop" | "source-in" | "source-out" | "source-over" | "xor"

  interface DOMPointInit {
    w?: number;
    x?: number;
    y?: number;
    z?: number;
  }
  interface CanvasPath {
    arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void
    arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void
    bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void
    closePath(): void
    ellipse(
      x: number,
      y: number,
      radiusX: number,
      radiusY: number,
      rotation: number,
      startAngle: number,
      endAngle: number,
      counterclockwise?: boolean
    ): void
    lineTo(x: number, y: number): void
    moveTo(x: number, y: number): void
    quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void
    rect(x: number, y: number, w: number, h: number): void
    roundRect(x: number, y: number, w: number, h: number, radii?: number | DOMPointInit | (number | DOMPointInit)[]): void
  }
  
  type CanvasLineCap = 'butt' | 'round' | 'square'
  type CanvasLineJoin = 'bevel' | 'miter' | 'round'
  
  interface CanvasPathDrawingStyles {
    lineCap: CanvasLineCap
    lineDashOffset: number
    lineJoin: CanvasLineJoin
    lineWidth: number
    miterLimit: number
    getLineDash(): number[]
    setLineDash(segments: number[]): void
  }
  
  interface CanvasGradient {
    /**
     * Adds a color stop with the given color to the gradient at the given offset. 0.0 is the offset at one end of the gradient, 1.0 is the offset at the other end.
     *
     * Throws an "IndexSizeError" DOMException if the offset is out of range. Throws a "SyntaxError" DOMException if the color cannot be parsed.
     */
    addColorStop(offset: number, color: string): void
  }
  
  interface CanvasPattern {
    /** Sets the transformation matrix that will be used when rendering the pattern during a fill or stroke painting operation. */
    setTransform(transform?: DOMMatrix2DInit): void
  }
  
  interface CanvasFillStrokeStyles {
    fillStyle: string | CanvasGradient | CanvasPattern
    strokeStyle: string | CanvasGradient | CanvasPattern
    createConicGradient(startAngle: number, x: number, y: number): CanvasGradient
    createLinearGradient(x0: number, y0: number, x1: number, y1: number): CanvasGradient
    createPattern(image: ImageSource, repetition: string | null): CanvasPattern | null
    createRadialGradient(x0: number, y0: number, r0: number, x1: number, y1: number, r1: number): CanvasGradient
  }
  
  interface DOMMatrix2DInit {
    a?: number
    b?: number
    c?: number
    d?: number
    e?: number
    f?: number
    m11?: number
    m12?: number
    m21?: number
    m22?: number
    m41?: number
    m42?: number
  }
  
  interface Path2D extends CanvasPath {
    /** Adds to the path the path given by the argument. */
    addPath(path: Path2D, transform?: DOMMatrix2DInit): void
  }

  interface CanvasShadowStyles {
    shadowBlur: number;
    shadowColor: string;
    shadowOffsetX: number;
    shadowOffsetY: number;
  }
  
  interface CanvasCompositing {
    globalAlpha: number;
    globalCompositeOperation: GlobalCompositeOperation;
  }
  interface CanvasDrawPath {
    beginPath(): void
    clip(fillRule?: CanvasFillRule): void
    clip(path: Path2D, fillRule?: CanvasFillRule): void
    fill(fillRule?: CanvasFillRule): void
    fill(path: Path2D, fillRule?: CanvasFillRule): void
    isPointInPath(x: number, y: number, fillRule?: CanvasFillRule): boolean
    isPointInPath(path: Path2D, x: number, y: number, fillRule?: CanvasFillRule): boolean
    isPointInStroke(x: number, y: number): boolean
    isPointInStroke(path: Path2D, x: number, y: number): boolean
    stroke(): void
    stroke(path: Path2D): void
  }
  
  interface CanvasRect {
    clearRect(x: number, y: number, w: number, h: number): void
    fillRect(x: number, y: number, w: number, h: number): void
    strokeRect(x: number, y: number, w: number, h: number): void
  }
  
  interface CanvasTransform {
    // getTransform(): DOMMatrix;
    resetTransform(): void
    rotate(angle: number): void
    scale(x: number, y: number): void
    setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void
    // setTransform(transform?: DOMMatrix2DInit): void;
    transform(a: number, b: number, c: number, d: number, e: number, f: number): void
    translate(x: number, y: number): void
  }

  interface TextMetrics {
    /** Returns the measurement described below. */
    readonly actualBoundingBoxAscent: number;
    /** Returns the measurement described below. */
    readonly actualBoundingBoxDescent: number;
    /** Returns the measurement described below. */
    readonly actualBoundingBoxLeft: number;
    /** Returns the measurement described below. */
    readonly actualBoundingBoxRight: number;
    /** Returns the measurement described below. */
    readonly fontBoundingBoxAscent: number;
    /** Returns the measurement described below. */
    readonly fontBoundingBoxDescent: number;
    /** Returns the measurement described below. */
    readonly width: number;
  }
  interface CanvasText {
    fillText(text: string, x: number, y: number, maxWidth?: number): void
    measureText(text: string): TextMetrics
    strokeText(text: string, x: number, y: number, maxWidth?: number): void
  }
  interface CanvasDrawImage {
    drawImage(image: ImageSource, dx: number, dy: number): void
    drawImage(image: ImageSource, dx: number, dy: number, dw: number, dh: number): void
    drawImage(
      image: ImageSource,
      sx: number,
      sy: number,
      sw: number,
      sh: number,
      dx: number,
      dy: number,
      dw: number,
      dh: number
    ): void
  }

  interface CanvasState {
    restore(): void;
    save(): void;
  }
  interface RenderContext
    extends CanvasDrawImage,
      CanvasTextDrawingStyles,
      CanvasText,
      CanvasRect,
      CanvasPathDrawingStyles,
      CanvasFillStrokeStyles,
      CanvasTransform,
      CanvasDrawPath,
      CanvasShadowStyles,
      CanvasCompositing,
      CanvasState,
      CanvasPath {
    readonly canvas: Canvas
  }

  type Canvas<CanExclude extends boolean = false> = {
    width: number
    height: number
    getContext: (type: '2d' | 'webgl') => RenderContext
  } & (CanExclude extends true ? {
    toBlob(callback: (blob: any) => void, type?: string, quality?: any): void;
    toDataURL(type?: string, quality?: any): string;
  } : {})
  
}
// declare var SampleCanvas: {
//   prototype:  SampleCanvas.Canvas;
//   new(): SampleCanvas.Canvas;
// };
type SampleImage = {
  width: number
  height: number
  onload: (...args: unknown[]) => void
  src: string
}