/* eslint-disable no-console */
import express from "express";
import cors from "cors";
import errorHandler from "errorhandler";
import routes from "./routes";
import "../init";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

/** Middlewares */
// error middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send();
  next();
});

// test App
app.get("/", (req, res) => res.send("How did you get here?"));

app.use("/results", routes.results);
app.use("/users", routes.user);
app.use("/messages", routes.message);

app.use(errorHandler());

app.listen(process.env.PORT, () =>
  console.log(`DBCLIENT is listening on port ${process.env.PORT}!`)
);
