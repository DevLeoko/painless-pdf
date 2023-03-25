// Express start
import express from "express";
import fs from "fs";
import {
  column,
  div,
  image,
  row,
  sizedBox,
  table,
  tableHeader,
  tableRow,
  text,
} from "../builder/PdfBlueprint";
import { PdfDocument } from "../builder/PdfDocument";

const app = express();

// Array from 1 to 100
const numbers = Array.from(Array(200).keys()).map((n) => n + 1);

const loremIpsum =
  `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, nisl nec ultricies aliquam, nunc nisl aliquet nisl, eget aliquet n` +
  `metus nunc vel nunc. Nulla facil nisi, euismod vitae nisl nec, aliquet aliquam nunc. Nu` +
  ` amet, consectetur adipiscing elit. Sed euismod, nisl nec ultricies aliquam, nunc nisl`;

app.get("/", (req, res) => {
  const base64Image = fs.readFileSync("src/assets/testt.png", {
    encoding: "base64",
  });

  const doc = new PdfDocument(
    div(
      image({
        base64: base64Image,
        fileType: "PNG",
        originalWidth: 574,
        originalHeight: 121,
        width: 50,
      }),
      // div(
      //   row(
      //     [
      //       div(text(loremIpsum), {
      //         backgroundColor: "red",
      //       }),
      //       div(text("Hi"), {
      //         width: { relative: 0.75 },
      //         backgroundColor: "blue",
      //       }),
      //     ],
      //     {
      //       width: { relative: 1 },
      //       growIndex: 0,
      //     }
      //   ),
      //   {
      //     backgroundColor: "yellow",
      //   }
      // ),
      { padding: 10 }
    ),
    {}
  );
  const pdfOutput = doc.build().output("arraybuffer");
  res.contentType("application/pdf");
  const buff = Buffer.from(pdfOutput as any, "ascii");
  res.send(buff);
});

app.listen(3000, () => {
  console.log("Server started on port 3000");
});
