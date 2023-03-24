import jsPDF from "jspdf";
import { PdfComponent } from "./PdfComponent";
import { getWidth } from "./component-utils";

export interface SizedBoxOptions {
  height?: number;
  width?: number | { pct: number };
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

  public getHeight(width: number): number {
    return this.options.height ?? 0;
  }

  protected render(
    x: number,
    y: number,
    width: number,
    availableHeight: number
  ): void {
    // No rendering needed for SizedBoxComponent as it's just an empty space
  }
}
