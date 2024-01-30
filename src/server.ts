import express from "express";
import crawling from "./script/crawler";

const app = express();
const port = 3000;

app.listen(port, () => {
  crawling();
});
