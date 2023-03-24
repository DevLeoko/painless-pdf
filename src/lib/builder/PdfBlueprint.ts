import jsPDF from "jspdf";
import {
  ColumnComponent,
  ColumnOptionsInput,
} from "../components/ColumnComponent";
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

interface PdfBlueprint {
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

export function row(
  children: PdfBlueprint[],
  options: RowOptionsInput & InheritedOptions
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
  options: ColumnOptionsInput & InheritedOptions
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
