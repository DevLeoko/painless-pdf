import jsPDF, { DocumentProperties } from "jspdf";
import { HeaderFooterComponent } from "../components/HeaderFooterComponent";
import { PdfComponent } from "../components/PdfComponent";
import { PdfBlueprint } from "./PdfBlueprint";

export class PdfDocument {
  private doc: jsPDF;

  constructor(
    private blueprint: PdfBlueprint,
    private options: {
      header?:
        | PdfBlueprint
        | ((page: number, totalPages: number) => PdfBlueprint);
      footer?:
        | PdfBlueprint
        | ((page: number, totalPages: number) => PdfBlueprint);
      format?: string | [number, number];
    } = {}
  ) {
    this.doc = new jsPDF({ format: options.format });
  }

  private buildHeaderComponent(totalPages: number) {
    return this.options.header && typeof this.options.header === "function"
      ? (page: number) =>
          (
            this.options.header as (
              page: number,
              totalPages: number
            ) => PdfBlueprint
          )(page, totalPages).invoke(this.doc, {})
      : (this.options.header as PdfBlueprint | undefined)?.invoke(this.doc, {});
  }

  private buildFooterComponent(totalPages: number) {
    return this.options.footer && typeof this.options.footer === "function"
      ? (page: number) =>
          (
            this.options.footer as (
              page: number,
              totalPages: number
            ) => PdfBlueprint
          )(page, totalPages).invoke(this.doc, {})
      : (this.options.footer as PdfBlueprint | undefined)?.invoke(this.doc, {});
  }

  private render(
    content: PdfComponent,
    dryRun: boolean,
    pageLimit: number = 100
  ): number {
    const { width, height } = this.doc.internal.pageSize;

    let lastContent: PdfComponent | void = content;

    let page = 1;
    do {
      const renderResult: ReturnType<
        (typeof PdfComponent)["prototype"]["apply"]
      > = lastContent.apply(0, 0, height, width, dryRun);

      lastContent = renderResult.nextPage;
      if (lastContent) {
        if (renderResult.renderedHeight == 0) {
          // throw new Error(
          //   "Rendered empty page while there is still content to render (infinite loop?)"
          // );
          console.log(
            "Rendered empty page while there is still content to render (infinite loop?)"
          );
        }

        if (!dryRun) this.doc.addPage();
      }
      page++;

      if (page > pageLimit) throw new Error("Too many pages");
    } while (lastContent);

    return page - 1;
  }

  private buildPageComponent(component: PdfComponent, totalPages: number) {
    return new HeaderFooterComponent(this.doc, component, {
      footer: this.buildFooterComponent(totalPages),
      header: this.buildHeaderComponent(totalPages),
      footerAtBottom: true,
    });
  }

  build(pageLimit: number = 100) {
    const component = this.blueprint.invoke(this.doc, {});

    let totalPages = 1;
    // If header or footer is defined as a function, we need to calculate the total number of pages
    if (
      typeof this.options.header === "function" ||
      typeof this.options.footer === "function"
    ) {
      let dryRunContent = this.buildPageComponent(component, 1);
      totalPages = this.render(dryRunContent, true, pageLimit);
    }

    let content = this.buildPageComponent(component, totalPages);
    this.render(content, false, pageLimit);
  }

  setTitle(title: string) {
    this.doc.setProperties({ title });
  }

  setDocumentInfo(info: DocumentProperties) {
    this.doc.setProperties(info);
  }

  getJsPdf() {
    return this.doc;
  }
}
