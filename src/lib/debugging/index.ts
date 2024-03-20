import express from "express";
import livereload from "livereload";
import {
  ppColumn,
  ppDiv,
  ppPageBreak,
  ppRow,
  ppSizedBox,
  ppText,
} from "../builder/PdfBlueprint";
import { PdfDocument } from "../builder/PdfDocument";

const app = express();

app.get("/", async (req, res) => {
  const doc = new PdfDocument(
    ppRow(
      [
        ppColumn(
          [ppText("Hi")],

          {
            div: {
              padding: 10,
              backgroundColor: "#aaa",
              width: 50,
            },
          }
        ),
        ppColumn(
          [
            ...new Array(25).fill(0).map((_, i) =>
              ppDiv(ppSizedBox({ width: 30, height: 30, fixedHeight: true }), {
                backgroundColor: i % 2 === 0 ? "red" : "blue",
                borderRadius: i % 2 === 0 ? 0 : 15,
              })
            ),
            ppPageBreak(),
          ],
          {
            div: {
              padding: 10,
              backgroundColor: "lightblue",
              width: { relative: 1 },
            },
          }
        ),
      ],
      {
        crossAxisAlignment: "stretch",
        keepTogether: false,
        div: {
          backgroundColor: "lightgreen",
        },
      }
    )
  );

  doc.build().then(() => {
    const pdfOutput = doc.getJsPdf().output("arraybuffer");
    res.contentType("application/pdf");
    const buff = Buffer.from(pdfOutput as any, "ascii");
    res.send(buff);
  });
});

const liveReload = livereload.createServer();

// Refresh on browser connection
liveReload.server.once("connection", () => {
  console.log("LiveReload connected");
  setTimeout(() => {
    liveReload.refresh("/");
  }, 500);
});

app.listen(3000, () => {
  console.log("Server started on port 3000");
});
