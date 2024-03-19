import jsPDF from "jspdf";
import { getWidth, Width } from "./component-utils";
import { PdfComponent, RenderResult } from "./PdfComponent";

export interface SizedBoxOptions {
  height?: number | "max";
  width?: Width;
}

export class SizedBoxComponent extends PdfComponent {
  private options: SizedBoxOptions;

  constructor(document: jsPDF, options: SizedBoxOptions) {
    super(document);
    this.options = options;
  }

  public getPreferredWidth(containerWidth: number): number {
    if (this.options.width) {
      return getWidth(containerWidth, this.options.width);
    } else {
      return 0;
    }
  }

  public getHeight(width: number, availableHeight: number): number {
    if (this.options.height === "max") return availableHeight;

    return this.options.height ?? 0;
  }

  public async render(
    x: number,
    y: number,
    width: number,
    availableHeight: number
  ): Promise<RenderResult> {
    // No rendering needed for SizedBoxComponent as it's just an empty space
    return {
      renderedHeight: Math.min(
        availableHeight,
        this.getHeight(width, availableHeight)
      ),
    };
  }
}
