const express = require("express");
const Route = express.Router();

const booksController = require("../controllers/books");
const upload = require("../helpers/fileUpload");
const { authentication, authorization } = require("../middleware/auth");

Route.get("/", booksController.getBooks)
  .post("/", authentication, authorization, upload, booksController.postBook)
  .put("/:id", authentication, authorization, upload, booksController.putBook)
  .delete("/:id", authentication, authorization, booksController.deleteBook);

module.exports = Route;
