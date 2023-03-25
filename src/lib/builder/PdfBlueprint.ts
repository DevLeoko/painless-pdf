import jsPDF from "jspdf";
import {
  ColumnComponent,
  ColumnOptionsInput,
} from "../components/ColumnComponent";
import { Width } from "../components/component-utils";
import { DivComponent } from "../components/DivComponent";
import { DivOptionsInput } from "../components/DivOptions";
import { HeaderFooterComponent } from "../components/HeaderFooterComponent";
import { PdfComponent } from "../components/PdfComponent";
import { RowComponent, RowOptionsInput } from "../components/RowComponent";
import {
  SizedBoxComponent,
  SizedBoxOptions,
} from "../components/SizedBoxComponent";
import { TextComponent, TextOptionsInput } from "../components/TextComponent";

export interface InheritedOptions {
  text?: TextOptionsInput;
}

export interface PdfBlueprint {
  invoke(doc: jsPDF, parentOptions: InheritedOptions): PdfComponent;
}

export function text(text: string, options?: TextOptionsInput): PdfBlueprint {
  return {
    invoke(doc: jsPDF, parentOptions: InheritedOptions) {
      return new TextComponent(doc, text, {
        ...parentOptions.text,
        ...options,
      });
    },
  };
}

export function sizedBox(options: SizedBoxOptions) {
  return {
    invoke(doc: jsPDF) {
      return new SizedBoxComponent(doc, options);
    },
  };
}

export function div(
  child: PdfBlueprint,
  options: DivOptionsInput & InheritedOptions
): PdfBlueprint {
  return {
    invoke(doc: jsPDF, parentOptions: InheritedOptions) {
      return new DivComponent(
        doc,
        child.invoke(doc, { ...parentOptions, ...options }),
        options
      );
    },
  };
}

export function row(
  children: PdfBlueprint[],
  options: RowOptionsInput & InheritedOptions = {}
): PdfBlueprint {
  return {
    invoke(doc: jsPDF, parentOptions: InheritedOptions) {
      return new RowComponent(
        doc,
        children.map((child) =>
          child.invoke(doc, { ...parentOptions, ...options })
        ),
        options
      );
    },
  };
}

export function column(
  children: PdfBlueprint[],
  options: ColumnOptionsInput & InheritedOptions = {}
): PdfBlueprint {
  return {
    invoke(doc: jsPDF, parentOptions: InheritedOptions) {
      return new ColumnComponent(
        doc,
        children.map((child) =>
          child.invoke(doc, { ...parentOptions, ...options })
        ),
        options
      );
    },
  };
}

export function tableRow(
  cells: PdfBlueprint[],
  options: {
    rowOptions?: DivOptionsInput & InheritedOptions;
    cellOptions?: DivOptionsInput;
  } = {}
) {
  return {
    options,
    cells,
  };
}

export type TableRowBlueprint = ReturnType<typeof tableRow>;

export function tableHeader(
  cells: PdfBlueprint[] | ((page: number) => PdfBlueprint[]),
  options: {
    rowOptions?: DivOptionsInput & InheritedOptions;
    cellOptions?: DivOptionsInput;
  } = {}
) {
  return {
    options,
    cells,
  };
}

export type TableHeaderBlueprint = ReturnType<typeof tableHeader>;

function createTableHeaderOrFooterComponent(
  doc: jsPDF,
  widths: Width[],
  parentOptions: InheritedOptions,
  data: ReturnType<typeof tableHeader>
) {
  if (typeof data.cells === "function") {
    return (page: number) =>
      createTableRow(
        widths,
        (data.cells as (page: number) => PdfBlueprint[])(page),
        data.options.cellOptions,
        data.options.rowOptions
      ).invoke(doc, parentOptions);
  } else {
    return createTableRow(
      widths,
      data.cells,
      data.options.cellOptions,
      data.options.rowOptions
    ).invoke(doc, parentOptions);
  }
}

function createTableRow(
  widths: Width[],
  cells: PdfBlueprint[],
  cellOptions: DivOptionsInput = {},
  rowOptions: DivOptionsInput = {}
): PdfBlueprint {
  const tableRow = row(
    cells.map((col, i) => {
      return div(col, { ...cellOptions, width: widths[i] });
    })
  );

  if (rowOptions) {
    return div(tableRow, rowOptions);
  } else {
    return tableRow;
  }
}

export function table({
  header,
  rows,
  widths,
  footer,
  options,
}: {
  header: ReturnType<typeof tableHeader>;
  rows: ReturnType<typeof tableRow>[];
  widths?: (null | Width)[];
  footer?: ReturnType<typeof tableHeader>;
  options?: InheritedOptions;
}): PdfBlueprint {
  let numCols = header.cells.length ?? rows[0]?.cells.length ?? 0;

  if (!widths) {
    if (numCols === 0) {
      throw new Error(
        "Table column widths must be specified if no static header or rows are provided"
      );
    }

    widths = new Array(numCols).fill({ relative: 1 / numCols });
  }

  const computedWidths = widths.map((w) => {
    if (w === null) {
      return { relative: 1 };
    } else {
      return w;
    }
  }) as Width[];

  return {
    invoke(doc: jsPDF, parentOptions: InheritedOptions) {
      parentOptions = { ...parentOptions, ...options };

      const headerComponent = createTableHeaderOrFooterComponent(
        doc,
        computedWidths,
        parentOptions,
        header
      );

      const rowsComponents = rows.map((row) =>
        createTableRow(
          computedWidths,
          row.cells,
          row.options.cellOptions,
          row.options.rowOptions
        ).invoke(doc, parentOptions)
      );

      const footerComponent = footer
        ? createTableHeaderOrFooterComponent(
            doc,
            computedWidths,
            parentOptions,
            footer
          )
        : undefined;

      const tableColumn = new ColumnComponent(doc, rowsComponents);

      return new HeaderFooterComponent(doc, tableColumn, {
        header: headerComponent,
        footer: footerComponent,
      });
    },
  };
}
