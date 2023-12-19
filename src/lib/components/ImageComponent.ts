import jsPDF from "jspdf";
import { PdfComponent } from "./PdfComponent";
import sizeOf from "image-size";
import { Width, getWidth } from "./component-utils";

export interface ImageOptions {
  base64: string;
  width?: Width;
  height?: number;
  maxWidth?: Width;
  maxHeight?: number;
}

export class ImageComponent extends PdfComponent {
  private options: ImageOptions;
  private aspectRatio: number;
  private fileType: string;

  constructor(document: jsPDF, options: ImageOptions) {
    super(document);
    this.options = options;

    const {
      width: detectedWidth,
      height: detectedHeight,
      type,
    } = sizeOf(Buffer.from(options.base64, "base64"));

    if (detectedWidth === undefined || detectedHeight === undefined || !type) {
      throw new Error("Could not detect image dimensions");
    }

    this.aspectRatio = detectedWidth / detectedHeight;
    this.fileType = type.toUpperCase();

    if (!this.options.width && !this.options.height) {
      this.options.width = 30;
    }
  }

  public getPreferredWidth(containerWidth: number): number {
    if (this.options.width) {
      const specifiedWidth = getWidth(containerWidth, this.options.width);

      if (this.options.maxHeight) {
        // Check if max height constraint is violated
        const maxWidthByHeight = this.options.maxHeight * this.aspectRatio;

        if (specifiedWidth > maxWidthByHeight) {
          return maxWidthByHeight;
        }
      }

      return specifiedWidth;
    } else {
      const widthByHeight = Math.min(
        containerWidth,
        this.options.height! * this.aspectRatio
      );

      // Check if max width constraint is violated
      if (this.options.maxWidth) {
        const maxWidth = getWidth(containerWidth, this.options.maxWidth);

        if (widthByHeight > maxWidth) {
          return maxWidth;
        }
      }

      return widthByHeight;
    }
  }

  public getHeight(width: number): number {
    return width / this.aspectRatio;
  }

  public async render(
    x: number,
    y: number,
    width: number,
    availableHeight: number,
    dryRun: boolean
  ): Promise<{ nextPage?: PdfComponent; renderedHeight: number }> {
    if (availableHeight < this.getHeight(width))
      return { renderedHeight: 0, nextPage: this };

    if (!dryRun) {
      const height = this.getHeight(width);

      const base64DataUrl = `data:image/${this.fileType};base64,${this.options.base64}`;

      this.document.addImage(base64DataUrl, this.fileType, x, y, width, height);
    }

    return { renderedHeight: this.getHeight(width) };
  }
}
