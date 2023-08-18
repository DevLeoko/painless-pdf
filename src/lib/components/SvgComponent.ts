import jsPDF from "jspdf";
import { PdfComponent } from "./PdfComponent";
// import { Canvg } from "canvg";
import { JSDOM } from "jsdom";
import "svg2pdf.js";

export interface SvgOptions {
  svg: string;
  width?: number;
  height?: number;
}

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

      const element = this.svgDom.window.document.documentElement;

      // @ts-ignore
      global.document = this.svgDom.window.document;

      console.log(element);

      // @ts-ignore
      await this.document.svg(element!, { x, y, width, height });

      // const canvas = this.document.canvas;
      // canvas.width = width;
      // canvas.height = height;

      // const ctx = canvas.getContext("2d");

      // // @ts-ignore
      // const canvg = Canvg.fromString(ctx, this.options.svg, {
      //   DOMParser,
      // });
      // canvg.render({
      //   offsetX: x,
      //   offsetY: y,
      // });
    }

    return { renderedHeight: this.getHeight(width) };
  }
}
