/* eslint-disable no-console */
import { Router as expressRouter } from "express";

const router = expressRouter();

router.get("/:string", (req, res) => {
  const { string } = req.params;
  console.log(
    `SELECT * FROM \`products\` WHERE MATCH (title,description) AGAINST ('${string}')`
  );
  connection.query(
    `SELECT * FROM \`products\` WHERE MATCH (title,description) AGAINST ('${string}')`,
    (error, results) => {
      if (error) {
        throw error;
      }
      if (results.affectedRows > 0) {
        console.log(results);
      }
      return res.json(results);
    }
  );
});

export default router;
