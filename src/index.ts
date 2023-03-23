// Express start
import express from "express";
import jsPDF from "jspdf";
import { DivComponent } from "./lib/DivComponent";
import { RowComponent } from "./lib/RowComponent";
import { TextComponent } from "./lib/TextComponent";

const app = express();

app.get("/", (req, res) => {
  const doc = new jsPDF();

  const content = new DivComponent(
    doc,
    new RowComponent(
      doc,
      [
        new DivComponent(
          doc,
          new TextComponent(doc, "Hello\nworlg", { lineHeightFactor: 0.8 }),
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
          new TextComponent(doc, ":)", { lineHeightFactor: 0.8 }),
          {
            backgroundColor: "orange",
            padding: 0,
          }
        ),
      ],
      {
        width: { pct: 1 },
        mainAxisAlignment: "space-around",
      }
    ),
    {
      padding: 10,
    }
  );

  content.apply(0, 0, 297, 210);
  const pdfOutput = doc.output();
  res.contentType("application/pdf");
  res.send(pdfOutput);
});

app.listen(3000, () => {
  console.log("Server started on port 3000");
});
