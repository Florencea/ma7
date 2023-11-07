import { ConfigurationOptions } from "crawlee";
import { join } from "node:path";
import process from "node:process";

const __dirname = process.cwd();
export const DB_DIR_PATH = join(__dirname, "public");
export const DB_PATH = join(DB_DIR_PATH, "data.json");
export const IMG_DIR_PATH = join(DB_DIR_PATH, "img");
export const CACHE_DIR_PATH = join(__dirname, ".next", "cache", "img");
export const CACHE_FILE_PATH = join(CACHE_DIR_PATH, "cache.txt");
export const DATE_FORMAT = "YYYY-MM-DD";
export const IMAGE_MIMETYPE = [
  "image/jpeg",
  "image/png",
  "image/avif",
  "image/webp",
  "image/bmp",
  "image/gif",
];
export const IMAGE_404_LIST = [
  "https://myself-bbs.com/data/attachment/forum/201607/09/1037264653qk9qn949kgqs.jpg",
];
export const IMAGE_DUPLICATEID_MAP = new Map([[45295, 45299]]);
export const CRAWLER_CONFIG = {
  maxConcurrency: 50,
  maxRequestRetries: 3,
  requestHandlerTimeoutSecs: 30,
  retryOnBlocked: true,
};
export const CRAWLER_OPTIONS: ConfigurationOptions = {
  logLevel: 1,
  persistStorage: false,
};
export const BANGUMI_URL_TEMPLATE = (id: number) =>
  `https://myself-bbs.com/thread-${id}-1-1.html`;
const ONAIR_URL = "https://myself-bbs.com/forum-133-1.html";
const ENDED_URL = "https://myself-bbs.com/forum-113-1.html";
export const INDEX_URL_LIST = [ONAIR_URL, ENDED_URL];

export type FullBangumiT = {
  id: number;
  _end: boolean;
  title: string;
  _imgUrl: string;
  info: string;
  start: string;
  by: string;
  site: string;
  total: string;
  stat: string;
};

export const EMPTY_BANGUMI: FullBangumiT = {
  id: -1,
  _end: true,
  title: "",
  _imgUrl: "",
  info: "",
  start: "",
  by: "",
  site: "",
  total: "",
  stat: "",
};
