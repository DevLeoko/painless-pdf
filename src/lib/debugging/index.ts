import express from "express";
import fs from "fs";
import { ppColumn, ppDiv, ppSvg, ppText } from "../builder/PdfBlueprint";
import { PdfDocument } from "../builder/PdfDocument";

const app = express();

// Array from 1 to 100
// const numbers = Array.from(Array(200).keys()).map((n) => n + 1);

app.get("/", (req, res) => {
  const testSvg = fs.readFileSync("src/assets/test.svg", { encoding: "utf8" });

  // const base64Image = fs.readFileSync("src/assets/test.png", {
  //   encoding: "base64",
  // });

  // const helloWorldText = ppText("Hello World", {
  //   fontSize: 20,
  //   textColor: "green",
  // });

  // const helloWorldDiv = ppDiv(helloWorldText, {
  //   backgroundColor: "lightgreen",
  //   border: { width: 1, color: "black" },
  //   padding: { left: 5 },
  // });

  const doc = new PdfDocument(
    ppColumn(
      // ppRow([helloWorldText, ppText("Lorem"), ppText("Ipsum")], {
      //   width: { relative: 1 },
      //   mainAxisAlignment: "space-between",
      //   crossAxisAlignment: "center",
      // }),
      [
        ppSvg({
          svg: testSvg,
          width: 30,
        }),
        ppSvg({
          svg: testSvg,
          width: 60,
        }),
        ppSvg({
          svg: testSvg,
          width: 30,
        }),

        ppDiv(ppText("Hello World"), {
          backgroundColor: "lightgreen",
          width: 30,
        }),
      ],
      { div: { padding: 20 } }
    ),
    {
      header: (page) => ppText(`Page ${page + 1}`, { underline: true }),
    }
  );

  doc.build().then(() => {
    const pdfOutput = doc.getJsPdf().output("arraybuffer");
    res.contentType("application/pdf");
    const buff = Buffer.from(pdfOutput as any, "ascii");
    res.send(buff);
  });
});

app.listen(3000, () => {
  console.log("Server started on port 3000");
});
