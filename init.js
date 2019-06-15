/* eslint-disable no-control-regex */
/* eslint-disable func-names */
/* eslint-disable no-console */
import mysql from "mysql";
import "dotenv/config";
import axios from "axios";

global.conf = process.env;

const connection = mysql.createConnection({
  host: conf.databaseHost,
  user: conf.databaseUser,
  password: conf.databasePass,
  database: conf.databaseName,
  multipleStatements: true
});

const createTableQuery = `CREATE TABLE IF NOT EXISTS \`products\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`title\` varchar(150) NOT NULL,
  \`description\` text NOT NULL,
  \`thumbnail\` varchar(100) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;`;

connection.connect();

const csvToArray = data => {
  const seen = [];
  JSON.stringify(data, function(key, val) {
    if (val != null && typeof val === "object") {
      if (seen.indexOf(val) >= 0) {
        return;
      }
      seen.push(val);
    }
    return val;
  });

  return seen;
};

const processLinks = links => {
  const imageLinks = [];
  if (!links || links[0] === "undefined") {
    return "";
  }
  for (let i = 0; i < links.length; i += 1) {
    if (links[i].href.match(/\.(jpg|png|gif|jpeg)/g) !== null) {
      imageLinks.push(links[i].href);
    }
  }
  if (imageLinks.length === 0) {
    return "";
  }
  return imageLinks[0];
};

const escapeString = val => {
  return val.replace(/[\0\n\r\b\t\\'"\x1a]/g, function(s) {
    switch (s) {
      case "\0":
        return "\\0";
      case "\n":
        return "\\n";
      case "\r":
        return "\\r";
      case "\b":
        return "\\b";
      case "\t":
        return "\\t";
      case "\x1a":
        return "\\Z";
      case "'":
        return "''";
      case '"':
        return '\\"';
      default:
        return `\\${s}`;
    }
  });
};

const axiosGET = id => {
  try {
    const axiosReturn = axios.get(
      `https://cmr.earthdata.nasa.gov/search/concepts/${id}.json`
    );
    return axiosReturn;
  } catch (error) {
    console.log(`A Bad Connection Was Skipped`);
    return false;
  }
};

const promiseAll = promises => {
  return new Promise((resolve, reject) => {
    const results = [];
    let count = 0;
    promises.forEach((promise, idx) => {
      console.log(idx);
      promise
        .then(valueOrError => {
          results[idx] = valueOrError;
          count += 1;
          if (count === promises.length) resolve(results);
        })
        .catch(err => {
          console.log(`Error When getting Remote Data ${err}`);
          return err;
        });
    });
  });
};

const realLog = data => {
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  process.stdout.write(data);
};
const convertJSONtoSQL = async () => {
  let query = "";
  try {
    console.log(`>>>>>>...Preparing Query`);
    const results = [];
    const data = await axios.get(conf.dataUrl);
    const seen = csvToArray(data);
    const each = seen[0].data.match(/,([\w\d-_])+,\d\n+/g);

    for (let i = 0; i < each.length; i += 4630) {
      const id = each[i].split(",")[1].trim();
      const here = await axios.get(
        `https://cmr.earthdata.nasa.gov/search/concepts/${id}.json`
      );

      realLog(
        `>>>>...Remote Data Querying: ${parseInt((i * 100) / each.length, 10)}%`
      );
      results.push(here);
    }
    process.stdout.write("\n");
    results.forEach(function(response, index) {
      const {
        data: { title, summary, links }
      } = response;

      const link = processLinks(links);
      const description = summary;
      query += `( "${escapeString(title)}", "${escapeString(
        description
      )}", "${link}")`;
      query += index !== results.length - 1 ? "," : "";
    });

    query = `INSERT into \`products\` (\`title\`,\`description\`,\`thumbnail\`) values ${query}; ALTER TABLE \`products\` ADD FULLTEXT( \`title\`, \`description\`);`;
  } catch (error) {
    console.log({
      msg: "Error Occurred During Conversion from CSV to MYSQL",
      error
    });
  }
  return query;
};

const createTable = connection.query(createTableQuery);
const checktable = connection.query(`SELECT count(*) from \`products\``);
createTable.on("result", async res => {
  checktable.on("result", async result => {
    if (result["count(*)"] === 0) {
      const query = await convertJSONtoSQL();
      connection.query(query, function(error, results, fields) {
        if (error) {
          throw error;
        }
        if (results.affectedRows > 0) {
          console.log(">>>>>>CSV has been loaded to DATABASE");
        }
      });
    }

    if (result["count(*)"] !== 0) {
      console.log(">>>>>> CSV Data is loaded");
    }
  });
});

global.connection = connection;
