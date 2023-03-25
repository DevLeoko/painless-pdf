import jsPDF from "jspdf";
import { PdfComponent } from "./PdfComponent";

export interface ImageOptions {
  base64: string;
  fileType: "JPEG" | "PNG";
  originalWidth: number;
  originalHeight: number;
  width?: number;
  height?: number;
}

export class ImageComponent extends PdfComponent {
  private options: ImageOptions;
  private aspectRatio: number;

  constructor(document: jsPDF, options: ImageOptions) {
    super(document);
    this.options = options;

    this.aspectRatio = options.originalWidth / options.originalHeight;

    if (!this.options.width && !this.options.height) {
      this.options.width = 50;
    }
  }

  public getPreferredWidth(containerWidth: number): number {
    if (this.options.width) {
      return this.options.width;
    } else {
      return Math.min(containerWidth, this.options.height! * this.aspectRatio);
    }
  }

  public getHeight(width: number): number {
    if (this.options.height) {
      return this.options.height;
    } else {
      return width / this.aspectRatio;
    }
  }

  public render(
    x: number,
    y: number,
    width: number,
    availableHeight: number,
    dryRun: boolean
  ) {
    if (availableHeight < this.getHeight(width))
      return { renderedHeight: 0, nextPage: this };

    if (!dryRun) {
      const height = this.getHeight(width);

      const base64DataUrl = `data:image/${this.options.fileType};base64,${this.options.base64}`;

      this.document.addImage(
        base64DataUrl,
        this.options.fileType,
        x,
        y,
        width,
        height
      );
    }

    return { renderedHeight: this.getHeight(width) };
  }
}
