import jsPDF from "jspdf";
import { PdfComponent } from "./PdfComponent";
// import { Canvg } from "canvg";
import { JSDOM } from "jsdom";
import "@leoko/svg2pdf.js";

export interface SvgOptions {
  svg: string;
  width?: number;
  height?: number;
}

const DUMMY_DOM = new JSDOM();

export class SvgComponent extends PdfComponent {
  private options: SvgOptions;
  private aspectRatio: number;
  private svgDom: JSDOM;

  constructor(document: jsPDF, options: SvgOptions) {
    super(document);
    this.options = options;

    this.svgDom = new JSDOM(this.options.svg, {
      contentType: "image/svg+xml",
    });

    const svgElement = this.svgDom.window.document.documentElement;

    const originalWidth = svgElement.getAttribute("width");
    const originalHeight = svgElement.getAttribute("height");

    if (!svgElement.hasAttribute("viewBox")) {
      svgElement.setAttribute(
        "viewBox",
        `0 0 ${originalWidth} ${originalHeight}`
      );
    }

    this.aspectRatio = Number(originalWidth) / Number(originalHeight);

    if (!this.options.width && !this.options.height) {
      this.options.width = 30;
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
      return this.options.width! / this.aspectRatio;
    }
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

      // @ts-ignore
      global.document = DUMMY_DOM.window.document;

      // @ts-ignore
      const element = this.svgDom.window.document.documentElement;

      // @ts-ignore
      await this.document.svg(element!, { x, y, width, height });
    }

    return { renderedHeight: this.getHeight(width) };
  }
}
