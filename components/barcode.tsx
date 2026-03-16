"use client";

import { useEffect, RefObject } from "react";
import JsBarcode from "jsbarcode";

interface BarcodeProps {
  value: string;
  svgRef: RefObject<SVGSVGElement | null>;
  className?: string;
}

export default function Barcode({ value, svgRef, className }: BarcodeProps) {
  useEffect(() => {
    if (svgRef.current && value) {
      JsBarcode(svgRef.current, value, {
        format: "CODE128",
        lineColor: "#1a1a1a",
        width: 2.5,
        height: 72,
        displayValue: false,
        margin: 0,
      });
    }
  }, [value, svgRef]);

  return <svg ref={svgRef} className={className} />;
}
