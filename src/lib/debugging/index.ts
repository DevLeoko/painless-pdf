// Express start
import express from "express";
import {
  column,
  div,
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

app.get("/", (req, res) => {
  // const doc = new PdfDocument(
  // );
  // const pdfOutput = doc.build().output();
  // res.contentType("application/pdf");
  // res.send(pdfOutput);
});

app.listen(3000, () => {
  console.log("Server started on port 3000");
});
