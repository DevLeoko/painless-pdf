import jsPDF from "jspdf";
import { HeaderFooterComponent } from "../components/HeaderFooterComponent";
import { PdfComponent } from "../components/PdfComponent";
import { PdfBlueprint } from "./PdfBlueprint";

export class PdfDocument {
  constructor(
    private blueprint: PdfBlueprint,
    private options: {
      header?: PdfBlueprint | ((page: number) => PdfBlueprint);
      footer?: PdfBlueprint | ((page: number) => PdfBlueprint);
    } = {}
  ) {}

  build(format?: string | [number, number], pageLimit: number = 100) {
    const doc = new jsPDF({ format });
    const { width, height } = doc.internal.pageSize;

    const component = this.blueprint.invoke(doc, {});
    const header =
      this.options.header && typeof this.options.header === "function"
        ? (page: number) =>
            (this.options.header as (page: number) => PdfBlueprint)(
              page
            ).invoke(doc, {})
        : this.options.header?.invoke(doc, {});

    const footer =
      this.options.footer && typeof this.options.footer === "function"
        ? (page: number) =>
            (this.options.footer as (page: number) => PdfBlueprint)(
              page
            ).invoke(doc, {})
        : this.options.footer?.invoke(doc, {});

    let content: PdfComponent | void = new HeaderFooterComponent(
      doc,
      component,
      {
        footer,
        header,
        footerAtBottom: true,
      }
    );

    let page = 1;
    do {
      const renderResult: ReturnType<
        typeof PdfComponent["prototype"]["apply"]
      > = content.apply(0, 0, height, width, false);

      content = renderResult.nextPage;
      if (content) {
        if (renderResult.renderedHeight == 0) {
          // throw new Error(
          //   "Rendered empty page while there is still content to render (infinite loop?)"
          // );
          console.log(
            "Rendered empty page while there is still content to render (infinite loop?)"
          );
        }

        doc.addPage();
      }
      page++;

      if (page > pageLimit) throw new Error("Too many pages");
    } while (content);

    return doc;
  }
}
