import { join } from "node:path";
import process from "node:process";

const __dirname = process.cwd();
export const DB_DIR_PATH = join(__dirname, "public");
export const DB_PATH = join(__dirname, "public", "data.json");

export const DATE_FORMAT = "YYYY-MM-DD";
export const COUNT_PER_PAGE = 20;
export const CRAWLER_CONFIG = {
  maxConcurrency: 50,
  maxRequestRetries: 3,
  requestHandlerTimeoutSecs: 30,
};
export const CRAWLER_OPTIONS = {
  logLevel: "ERROR",
  persistStorage: false,
};
/**
 * @param {number} i
 */
export const ONAIR_URL_TEMPLATE = (i) =>
  `https://myself-bbs.com/forum-133-${i + 1}.html`;
/**
 * @param {number} i
 */
export const ENDED_URL_TEMPLATE = (i) =>
  `https://myself-bbs.com/forum-113-${i + 1}.html`;
/**
 * @param {number} id
 */
export const BANGUMI_URL_TEMPLATE = (id) =>
  `https://myself-bbs.com/thread-${id}-1-1.html`;
/**
 * @param {number} id
 */
const ONAIR_URL = "https://myself-bbs.com/forum-133-1.html";
const ENDED_URL = "https://myself-bbs.com/forum-113-1.html";
export const INDEX_URL_LIST = [ONAIR_URL, ENDED_URL];
