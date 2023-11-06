import { join } from "node:path";
import process from "node:process";

const __dirname = process.cwd();
export const DB_DIR_PATH = join(__dirname, "public");
export const DB_PATH = join(__dirname, "public", "data.json");
export const IMG_DIR_PATH = join(__dirname, "public", "img");
export const CACHE_DIR_PATH = join(__dirname, "node_modules", ".imgcache");
export const CACHE_FILE_PATH = join(
  __dirname,
  "node_modules",
  ".imgcache",
  "cache.json",
);

export const DATE_FORMAT = "YYYY-MM-DD";
export const COUNT_PER_PAGE = 20;
export const IMAGE_MIMETYPE = [
  "image/jpeg",
  "image/png",
  "image/avif",
  "image/webp",
  "image/bmp",
  "image/gif",
];
export const IMAGE_DUPLICATEID_MAP = new Map([[45295, 45299]]);
export const START_CORRECTION_MAP = new Map([
  [50032, "2023-10-07"],
  [42650, "2013-01-02"],
  [44473, "2014-09-28"],
  [44620, "2014-08-22"],
  [44819, "2013-04-28"],
  [45311, "2019-05-24"],
  [47141, "2021-02-25"],
  [48332, "2022-07-07"],
  [49522, "2023-04-09"],
]);
export const CRAWLER_CONFIG = {
  maxConcurrency: 50,
  maxRequestRetries: 3,
  requestHandlerTimeoutSecs: 30,
  retryOnBlocked: true,
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
