import jsPDF from "jspdf";
import {
  ColumnComponent,
  ColumnOptionsInput,
} from "../components/ColumnComponent";
import { Width } from "../components/component-utils";
import { DivComponent } from "../components/DivComponent";
import { DivOptionsInput } from "../components/DivOptions";
import { HeaderFooterComponent } from "../components/HeaderFooterComponent";
import { ImageComponent, ImageOptions } from "../components/ImageComponent";
import { PdfComponent } from "../components/PdfComponent";
import { RowComponent, RowOptionsInput } from "../components/RowComponent";
import {
  SizedBoxComponent,
  SizedBoxOptions,
} from "../components/SizedBoxComponent";
import { TextComponent, TextOptionsInput } from "../components/TextComponent";
import { SvgComponent, SvgOptions } from "../components/SvgComponent";

export interface InheritedOptions {
  text?: TextOptionsInput;
}

export interface DivWrapperOptions {
  div?: DivOptionsInput & InheritedOptions;
}

export interface PdfBlueprint {
  invoke(doc: jsPDF, parentOptions: InheritedOptions): PdfComponent;
}

function mergeInheritedOptions(
  parentOptions?: InheritedOptions,
  options?: InheritedOptions
): InheritedOptions {
  return {
    text: {
      ...parentOptions?.text,
      ...options?.text,
    },
  };
}

export function ppPageBreak() {
  return {
    invoke(doc: jsPDF) {
      return new SizedBoxComponent(doc, { height: "max" });
    },
  };
}

export function ppText(
  text: string,
  options?: TextOptionsInput & DivWrapperOptions
): PdfBlueprint {
  if (options?.div)
    return ppDiv(ppText(text, { ...options, div: undefined }), options.div);

  return {
    invoke(doc: jsPDF, parentOptions: InheritedOptions) {
      return new TextComponent(doc, text, {
        ...parentOptions.text,
        ...options,
      });
    },
  };
}

export function ppImage(options: ImageOptions) {
  return {
    invoke(doc: jsPDF) {
      return new ImageComponent(doc, options);
    },
  };
}

export function ppSvg(options: SvgOptions) {
  return {
    invoke(doc: jsPDF) {
      return new SvgComponent(doc, options);
    },
  };
}

export function ppSizedBox(options: SizedBoxOptions) {
  return {
    invoke(doc: jsPDF) {
      return new SizedBoxComponent(doc, options);
    },
  };
}

export function ppDiv(
  child: PdfBlueprint,
  options: DivOptionsInput & InheritedOptions = {}
): PdfBlueprint {
  return {
    invoke(doc: jsPDF, parentOptions: InheritedOptions) {
      return new DivComponent(
        doc,
        child.invoke(doc, mergeInheritedOptions(parentOptions, options)),
        options
      );
    },
  };
}

export function ppRow(
  children: PdfBlueprint[],
  options: RowOptionsInput & InheritedOptions & DivWrapperOptions = {}
): PdfBlueprint {
  if (options?.div)
    return ppDiv(ppRow(children, { ...options, div: undefined }), options.div);

  return {
    invoke(doc: jsPDF, parentOptions: InheritedOptions) {
      return new RowComponent(
        doc,
        children.map((child) =>
          child.invoke(doc, mergeInheritedOptions(parentOptions, options))
        ),
        options
      );
    },
  };
}

export function ppColumn(
  children: (PdfBlueprint | "spacer")[],
  options: ColumnOptionsInput & InheritedOptions & DivWrapperOptions = {}
): PdfBlueprint {
  if (options?.div)
    return ppDiv(
      ppColumn(children, { ...options, div: undefined }),
      options.div
    );

  return {
    invoke(doc: jsPDF, parentOptions: InheritedOptions) {
      return new ColumnComponent(
        doc,
        children.map((child) =>
          child === "spacer"
            ? child
            : child.invoke(doc, mergeInheritedOptions(parentOptions, options))
        ),
        options
      );
    },
  };
}

export function ppTableRow(
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

export type TableRowBlueprint = ReturnType<typeof ppTableRow>;

export function ppTableHeader(
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

export type TableHeaderBlueprint = ReturnType<typeof ppTableHeader>;

function createTableHeaderOrFooterComponent(
  doc: jsPDF,
  widths: (Width | null)[],
  parentOptions: InheritedOptions,
  cellOptions: DivOptionsInput | undefined,
  data: TableHeaderBlueprint,
  borders: TableBorderOptions | undefined,
  firstRow: boolean
) {
  if (typeof data.cells === "function") {
    return (page: number) =>
      createTableRow(
        widths,
        (data.cells as (page: number) => PdfBlueprint[])(page),
        merge(cellOptions, data.options.cellOptions),
        data.options.rowOptions,
        borders,
        firstRow
      ).invoke(doc, parentOptions);
  } else {
    return createTableRow(
      widths,
      data.cells,
      merge(cellOptions, data.options.cellOptions),
      data.options.rowOptions,
      borders,
      firstRow
    ).invoke(doc, parentOptions);
  }
}

interface TableBorderOptions {
  color: string;
  verticalWidth: number | number[];
  horizontalWidth: number;
}

function createTableRow(
  widths: (Width | null)[],
  cells: PdfBlueprint[],
  cellOptions: DivOptionsInput | undefined,
  rowOptions: DivOptionsInput | undefined,
  borders: TableBorderOptions | undefined,
  firstRow: boolean
): PdfBlueprint {
  let growIndex: number | undefined = widths.findIndex((w) => w === null);
  if (growIndex === -1) growIndex = undefined;

  const tableRow = ppRow(
    cells.map((col, i) => {
      let verticalBorders = undefined;
      if (borders) {
        const isArray = Array.isArray(borders.verticalWidth);
        verticalBorders = {
          left:
            i === 0
              ? {
                  color: borders.color,
                  width: isArray
                    ? (borders.verticalWidth as number[])[0]
                    : (borders.verticalWidth as number),
                }
              : undefined,
          right: {
            color: borders.color!,
            width: isArray
              ? (borders.verticalWidth as number[])[i + 1]
              : (borders.verticalWidth as number),
          },
        };
      }

      return ppDiv(col, {
        border: verticalBorders,
        ...cellOptions,
        width: widths[i] ?? undefined,
      });
    }),
    {
      growIndex,
      crossAxisAlignment: "stretch",
      width: growIndex !== undefined ? { relative: 1 } : undefined,
    }
  );

  if (rowOptions || borders?.horizontalWidth) {
    let borderOptions = undefined;
    if (borders?.horizontalWidth) {
      const border = { width: borders.horizontalWidth, color: borders.color };
      borderOptions = {
        top: firstRow ? border : undefined,
        bottom: border,
      };
    }

    return ppDiv(tableRow, { border: borderOptions, ...rowOptions });
  } else {
    return tableRow;
  }
}

function merge(
  a: Record<string, any> | undefined,
  b: Record<string, any> | undefined
) {
  if (!a) return b;
  if (!b) return a;
  if (!a && !b) return undefined;

  return { ...a, ...b };
}

export function ppTable({
  header,
  rows,
  widths,
  footer,
  options,
  borders,
  cellOptions,
  div,
}: {
  header?: TableHeaderBlueprint;
  rows: (TableRowBlueprint | "spacer")[];
  widths?: (null | Width)[];
  footer?: TableHeaderBlueprint;
  options?: InheritedOptions;
  cellOptions?: DivOptionsInput;
  borders?: TableBorderOptions;
  div?: DivOptionsInput;
}): PdfBlueprint {
  if (div)
    return ppDiv(
      ppTable({
        header,
        rows,
        widths,
        footer,
        options,
        borders,
        cellOptions,
      }),
      div
    );

  if (rows[0] == "spacer") throw new Error("First row cannot be a spacer");

  let numCols = header?.cells?.length ?? rows[0]?.cells.length ?? 0;

  if (!header && !footer && rows.length === 0) return ppSizedBox({ height: 0 });

  if (!widths) {
    if (numCols === 0) {
      throw new Error(
        "Table column widths must be specified if no static header or rows are provided"
      );
    }

    widths = new Array(numCols).fill({ relative: 1 / numCols });
  } else {
    numCols = widths.length;

    // There can only be one null width
    if (widths.filter((w) => w === null).length > 1)
      throw new Error("Only one column can have a null width");

    if (
      borders &&
      Array.isArray(borders.verticalWidth) &&
      borders.verticalWidth.length !== numCols + 1
    ) {
      throw new Error(
        "Number of vertical borders must be one more than the number of columns"
      );
    }
  }

  return {
    invoke(doc: jsPDF, parentOptions: InheritedOptions) {
      parentOptions = mergeInheritedOptions(parentOptions, options);

      const headerComponent = header
        ? createTableHeaderOrFooterComponent(
            doc,
            widths!,
            parentOptions,
            cellOptions,
            header,
            borders,
            true
          )
        : undefined;

      const rowsComponents = rows.map((row, i) =>
        row === "spacer"
          ? "spacer"
          : createTableRow(
              widths!,
              row.cells,
              merge(cellOptions, row.options.cellOptions),
              row.options.rowOptions,
              borders,
              !header && i === 0
            ).invoke(doc, parentOptions)
      );

      const footerComponent = footer
        ? createTableHeaderOrFooterComponent(
            doc,
            widths!,
            parentOptions,
            cellOptions,
            footer,
            borders,
            !header && rows.length === 0
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
