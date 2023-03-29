// Express start
import express from "express";
// import fs from "fs";
import { ppDiv, ppRow, ppText } from "../builder/PdfBlueprint";
import { PdfDocument } from "../builder/PdfDocument";

const app = express();

// Array from 1 to 100
// const numbers = Array.from(Array(200).keys()).map((n) => n + 1);

app.get("/", (req, res) => {
  // const base64Image = fs.readFileSync("src/assets/test.png", {
  //   encoding: "base64",
  // });

  const helloWorldText = ppText("Hello World", {
    fontSize: 20,
    textColor: "green",
  });

  // const helloWorldDiv = ppDiv(helloWorldText, {
  //   backgroundColor: "lightgreen",
  //   border: { width: 1, color: "black" },
  //   padding: { left: 5 },
  // });

  const doc = new PdfDocument(
    ppDiv(
      ppRow([helloWorldText, ppText("Lorem"), ppText("Ipsum")], {
        width: { relative: 1 },
        mainAxisAlignment: "space-between",
        crossAxisAlignment: "center",
      }),
      { padding: 20 }
    ),
    {
      header: (page) => ppText(`Page ${page + 1}`, { underline: true }),
    }
  );
  const pdfOutput = doc.build().output("arraybuffer");
  res.contentType("application/pdf");
  const buff = Buffer.from(pdfOutput as any, "ascii");
  res.send(buff);
});

app.listen(3000, () => {
  console.log("Server started on port 3000");
});
