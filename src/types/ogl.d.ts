declare module 'ogl' {
  export class Renderer {
    constructor(options?: {
      canvas?: HTMLCanvasElement;
      width?: number;
      height?: number;
      dpr?: number;
      alpha?: boolean;
      depth?: boolean;
      stencil?: boolean;
      antialias?: boolean;
      premultipliedAlpha?: boolean;
      preserveDrawingBuffer?: boolean;
      powerPreference?: string;
      autoClear?: boolean;
      webgl?: number;
    });
    gl: any;
    setSize(width: number, height: number): void;
    render(options: { scene: any; camera?: any }): void;
  }

  export class Program {
    constructor(
      gl: any,
      options: {
        vertex: string;
        fragment: string;
        uniforms?: Record<string, any>;
        transparent?: boolean;
        cullFace?: any;
        frontFace?: any;
        depthTest?: boolean;
        depthWrite?: boolean;
        depthFunc?: any;
      }
    );
    uniforms: Record<string, any>;
  }

  export class Mesh {
    constructor(gl: any, options: { geometry: any; program: any; mode?: number });
  }

  export class Triangle {
    constructor(gl: any, options?: any);
    attributes: Record<string, any>;
  }

  export class Color extends Array {
    constructor(...args: any[]);
    r: number;
    g: number;
    b: number;
    set(...args: any[]): this;
    copy(c: any): this;
  }

  export const Camera: any;
  export const Transform: any;
  export const Texture: any;
  export const Geometry: any;
  export const Vec2: any;
  export const Vec3: any;
  export const Vec4: any;
  export const Mat3: any;
  export const Mat4: any;
  export const Quat: any;
  export const Euler: any;
}
