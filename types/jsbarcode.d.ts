declare module "jsbarcode" {
  function JsBarcode(
    element: Element | string,
    value: string,
    options?: {
      format?: string;
      lineColor?: string;
      width?: number;
      height?: number;
      displayValue?: boolean;
      margin?: number;
      [key: string]: unknown;
    }
  ): void;
  export = JsBarcode;
}
