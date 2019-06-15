import log4js from "log4js";
import "dotenv/config";

global.conf = process.env;

log4js.configure({
  appenders: {
    out: { type: "stdout", layout: { type: "coloured" } },
    everything: { type: "stdout", filename: "logs/all.log" }
  },
  categories: { default: { appenders: ["everything"], level: "ALL" } }
});

global.Logger = log4js.getLogger(`[${conf.projectName}]`);

export default conf;
