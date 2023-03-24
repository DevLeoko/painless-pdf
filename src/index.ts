// Express start
import express from "express";
import jsPDF from "jspdf";
import { ColumnComponent } from "./lib/components/ColumnComponent";
import { DivComponent } from "./lib/components/DivComponent";
import { HeaderFooterComponent } from "./lib/components/HeaderFooterComponent";
import { PdfComponent } from "./lib/components/PdfComponent";
import { RowComponent } from "./lib/components/RowComponent";
import { SizedBoxComponent } from "./lib/components/SizedBoxComponent";
import { TextComponent } from "./lib/components/TextComponent";

const app = express();

app.get("/", (req, res) => {
  const doc = new jsPDF();

  const firstRow = new RowComponent(
    doc,
    [
      new DivComponent(
        doc,
        new TextComponent(doc, "This is\na text tesT", {
          lineHeightFactor: 2,
          align: "center",
        }),
        {
          backgroundColor: "red",
          padding: 0,
          border: { width: 2, color: "blue" },
        }
      ),
      new DivComponent(
        doc,
        new TextComponent(doc, "Word", { lineHeightFactor: 0.8 }),
        {
          backgroundColor: "yellow",
          padding: 0,
          border: {
            bottom: { width: 5, color: "blue" },
          },
        }
      ),
      new DivComponent(
        doc,
        new TextComponent(doc, "Worg", {
          lineHeightFactor: 0.8,
          fontSize: 20,
        }),
        {
          backgroundColor: "yellow",
          padding: 0,
          border: {
            bottom: { width: 5, color: "blue" },
          },
        }
      ),
      new DivComponent(
        doc,
        new TextComponent(doc, ":)", { lineHeightFactor: 1 }),
        {
          backgroundColor: "orange",
          padding: 0,
        }
      ),
    ],
    {
      width: { pct: 1 },
      mainAxisAlignment: "space-around",
      crossAxisAlignment: "center",
    }
  );

  const rows: PdfComponent[] = [];

  for (let i = 0; i < 45; i++) {
    rows.push(
      new DivComponent(
        doc,
        new TextComponent(doc, `Row ${i} :)`, {
          lineHeightFactor: 1,
          fontSize: 10 + i,
        }),
        {
          backgroundColor: "orange",
          padding: 3,
        }
      ),
      new SizedBoxComponent(doc, { height: 5 })
    );
  }

  let content: PdfComponent | void = new HeaderFooterComponent(
    doc,
    new DivComponent(
      doc,
      new ColumnComponent(doc, [
        firstRow,
        new ColumnComponent(doc, rows, {
          crossAxisAlignment: "center",
        }),
      ]),
      {
        padding: 10,
      }
    ),
    {
      header: (i) => new TextComponent(doc, `Header ${i}`),
      footer: new TextComponent(doc, "Footer"),
      footerAtBottom: true,
    }
  );

  do {
    content = content.apply(0, 0, 297, 210);
    if (content) doc.addPage();
  } while (content);
  const pdfOutput = doc.output();
  res.contentType("application/pdf");
  res.send(pdfOutput);
});

app.listen(3000, () => {
  console.log("Server started on port 3000");
});
