import { CheerioCrawler, Configuration, HttpCrawler } from "crawlee";
import dayjs from "dayjs";
import CustomParseFormat from "dayjs/plugin/customParseFormat.js";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { copyFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { BangumiParser } from "./crawler-bangumi-parser";
import {
  BANGUMI_URL_TEMPLATE,
  CACHE_DIR_PATH,
  CACHE_FILE_PATH,
  CRAWLER_CONFIG,
  CRAWLER_OPTIONS,
  DB_DIR_PATH,
  DB_PATH,
  FullBangumiT,
  IMAGE_404_LIST,
  IMAGE_DUPLICATEID_MAP,
  IMAGE_MIMETYPE,
  IMG_DIR_PATH,
  INDEX_URL_LIST,
} from "./crawler-config";
import { ContentParser } from "./crawler-content-parser";
import { IndexParser } from "./crawler-index-parser";
dayjs.extend(CustomParseFormat);

let GLOBAL_INDEX_DB: Map<number, FullBangumiT> = new Map();

const GLOBAL_PAGE_URLS_SET: Set<string> = new Set();
const GLOBAL_IMG_URLS_MAP: Map<string, number> = new Map();

export function now() {
  const current = new Date();
  const currentStr = new Intl.DateTimeFormat("lt-LT", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(current);
  return currentStr;
}

export function logger(content: string) {
  console.info(`${now()} ${content}`);
}

function saveGlobalIndexDb() {
  const rawData = [...GLOBAL_INDEX_DB.values()];
  const db_data = rawData
    .sort((a, b) => {
      // not end first
      if (a._end !== b._end) {
        return a._end ? 1 : -1;
      }
      // by start reverse
      if (a.start !== b.start) {
        const ad = dayjs(a.start);
        const as = ad.isValid() ? ad : dayjs("1900-01-01");
        const bd = dayjs(b.start);
        const bs = bd.isValid() ? bd : dayjs("1900-01-01");
        return as.isBefore(bs) ? 1 : -1;
      }
      // default by id reverse
      return b.id - a.id;
    })
    .map(({ _end, _imgUrl, ...rest }) => rest);
  const db_json = JSON.stringify(db_data);
  mkdirSync(DB_DIR_PATH, { recursive: true });
  writeFileSync(DB_PATH, db_json);
  logger(`Complete fetch ${GLOBAL_INDEX_DB.size} Bangumis.`);
}

const ImageCrawler = new HttpCrawler(
  {
    ...CRAWLER_CONFIG,
    additionalMimeTypes: IMAGE_MIMETYPE,
    requestHandler: async ({ request, body, response }) => {
      try {
        const id = Number(GLOBAL_IMG_URLS_MAP.get(request.url));
        const img = `${id}.avif`;
        const imgPath = join(IMG_DIR_PATH, img);
        const imgCachePath = join(CACHE_DIR_PATH, img);
        await sharp(body).toFormat("avif").toFile(imgPath);
        await copyFile(imgPath, imgCachePath);

        if (IMAGE_DUPLICATEID_MAP.has(id)) {
          const duplicate_id = Number(IMAGE_DUPLICATEID_MAP.get(id));
          const img_duplicate = `${duplicate_id}.avif`;
          const imgPath_duplicate = join(IMG_DIR_PATH, img_duplicate);
          const imgCachePath_duplicate = join(CACHE_DIR_PATH, img_duplicate);
          await sharp(body).toFormat("avif").toFile(imgPath_duplicate);
          await copyFile(imgPath_duplicate, imgCachePath_duplicate);
        }
      } catch {
        GLOBAL_IMG_URLS_MAP.delete(request.url);
        logger(
          `ERR: [retry ${request.retryCount}] [${response.statusCode}: ${response.statusMessage}] ${request.url}`,
        );
      }
    },
  },
  new Configuration(CRAWLER_OPTIONS),
);

const BangumiCrawler = new CheerioCrawler(
  {
    ...CRAWLER_CONFIG,
    requestHandler: async ({ request, $ }) => {
      const bangumiParser = new BangumiParser(request, $, GLOBAL_INDEX_DB);
      bangumiParser.parse((bangumi) => {
        GLOBAL_INDEX_DB.set(bangumi.id, bangumi);
        if (!IMAGE_404_LIST.includes(bangumi._imgUrl)) {
          GLOBAL_IMG_URLS_MAP.set(bangumi._imgUrl, bangumi.id);
        }
      });
    },
  },
  new Configuration(CRAWLER_OPTIONS),
);

const ContentCrawler = new CheerioCrawler(
  {
    ...CRAWLER_CONFIG,
    requestHandler: async ({ $ }) => {
      const contentParser = new ContentParser($);
      contentParser.parse((item) => {
        GLOBAL_INDEX_DB.set(item.id, item);
      });
    },
  },
  new Configuration(CRAWLER_OPTIONS),
);

const IndexCrawler = new CheerioCrawler(
  {
    ...CRAWLER_CONFIG,
    requestHandler: async ({ request, $ }) => {
      const indexParser = new IndexParser(request, $);
      indexParser.parse((url) => {
        GLOBAL_PAGE_URLS_SET.add(url);
      });
    },
  },
  new Configuration(CRAWLER_OPTIONS),
);

function loadCachedImgUrls() {
  mkdirSync(IMG_DIR_PATH, { recursive: true });
  mkdirSync(CACHE_DIR_PATH, { recursive: true });
  if (existsSync(CACHE_FILE_PATH)) {
    const cacheTxt = readFileSync(CACHE_FILE_PATH, { encoding: "utf-8" });
    return cacheTxt.split("\n");
  } else {
    return [];
  }
}

function pruneImgUrls(cachedImgUrls: string[], currentImgUrls: string[]) {
  const cachedImgUrlsSet = new Set(cachedImgUrls);
  const currentImgUrlsSet = new Set(currentImgUrls);
  const imgUrlsFromCache = [...currentImgUrlsSet].filter((img) =>
    cachedImgUrlsSet.has(img),
  );
  const imgUrlsFromSource = [...currentImgUrlsSet].filter(
    (img) => !cachedImgUrlsSet.has(img),
  );
  const imgUrlsAll = [...new Set([...imgUrlsFromCache, ...imgUrlsFromSource])];
  return { imgUrlsFromCache, imgUrlsFromSource, imgUrlsAll };
}

async function copyImgFromCache(imgUrls: string[]) {
  await Promise.all(
    imgUrls.map(async (imgUrl) => {
      const id = Number(GLOBAL_IMG_URLS_MAP.get(imgUrl));
      const img = `${id}.avif`;
      const source = join(CACHE_DIR_PATH, img);
      const destination = join(IMG_DIR_PATH, img);
      if (IMAGE_DUPLICATEID_MAP.has(id)) {
        const id_duplicate = Number(IMAGE_DUPLICATEID_MAP.get(id));
        const img_duplicate = `${id_duplicate}.avif`;
        const source_duplicate = join(CACHE_DIR_PATH, img_duplicate);
        const destination_duplicate = join(IMG_DIR_PATH, img_duplicate);
        if (existsSync(source_duplicate)) {
          await copyFile(source_duplicate, destination_duplicate);
        } else {
          logger(
            `[CACHE] cannot found ${source_duplicate} in cache, skip copy`,
          );
        }
      }
      if (existsSync(source)) {
        await copyFile(source, destination);
      } else {
        logger(`[CACHE] cannot found ${source} in cache, skip copy`);
      }
    }),
  );
}

function writeImgUrlsCacheList(imgUrls: string[]) {
  const imgUrlsTxt = imgUrls.join("\n");
  writeFileSync(CACHE_FILE_PATH, imgUrlsTxt);
}

async function restoreImgCache(currentImgUrls: string[]) {
  const cachedImgUrls = loadCachedImgUrls();
  const { imgUrlsFromCache, imgUrlsFromSource, imgUrlsAll } = pruneImgUrls(
    cachedImgUrls,
    currentImgUrls,
  );
  await copyImgFromCache(imgUrlsFromCache);
  logger(`Restore ${imgUrlsFromCache.length} images from cache`);
  writeImgUrlsCacheList(imgUrlsAll);
  return imgUrlsFromSource;
}

export default async function crawler() {
  try {
    logger("Fetch Bangumi Index...");
    await IndexCrawler.run(INDEX_URL_LIST);

    logger("Fetch Bangumi List...");
    await ContentCrawler.run([...GLOBAL_PAGE_URLS_SET.values()]);

    logger("Fetch Bangumi Content...");
    await BangumiCrawler.run(
      [...GLOBAL_INDEX_DB.keys()].map((id) => BANGUMI_URL_TEMPLATE(id)),
    );

    saveGlobalIndexDb();

    const allImgUrlsSize = GLOBAL_IMG_URLS_MAP.size;
    const imgsUrlsToFetch = await restoreImgCache([
      ...GLOBAL_IMG_URLS_MAP.keys(),
    ]);

    logger(
      `Fetch Bangumi Images, ${imgsUrlsToFetch.length} images needs to fetch...`,
    );
    await ImageCrawler.run(imgsUrlsToFetch);
    logger(
      `Complete fetch ${
        imgsUrlsToFetch.length - (allImgUrlsSize - GLOBAL_IMG_URLS_MAP.size)
      } images`,
    );
  } catch (err: any) {
    logger(`${err?.name}: ${err?.messsage}\n${err?.stack}`);
  }
}

crawler();
