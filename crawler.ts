import { CheerioCrawler, Configuration, HttpCrawler } from "crawlee";
import dayjs from "dayjs";
import CustomParseFormat from "dayjs/plugin/customParseFormat.js";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { copyFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { BangumiParser } from "./crawler-bangumi-parser";
import {
  CACHE_DIR_PATH,
  CACHE_FILE_PATH,
  CRAWLER_CONFIG,
  CRAWLER_OPTIONS,
  IMAGE_DUPLICATEID_MAP,
  IMAGE_MIMETYPE,
  IMG_DIR_PATH,
  INDEX_URL_LIST,
} from "./crawler-config";
import { ContentParser } from "./crawler-content-parser";
import { IndexParser } from "./crawler-index-parser";
import { Logger } from "./crawler-logger";
import { Storage } from "./crawler-storage";
dayjs.extend(CustomParseFormat);

const storage = new Storage();

const logger = new Logger();

const ImageCrawler = new HttpCrawler(
  {
    ...CRAWLER_CONFIG,
    additionalMimeTypes: IMAGE_MIMETYPE,
    requestHandler: async ({ request, body, response }) => {
      try {
        const id = storage.getImgId(request.url);
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
        storage.removeImg(request.url);
        logger.error(
          `[retry ${request.retryCount}] [${response.statusCode}: ${response.statusMessage}] ${request.url}`,
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
      const bangumiParser = new BangumiParser(request, $, storage.getStorage());
      bangumiParser.parse((bangumi) => {
        storage.addBangumi(bangumi.id, bangumi);
        storage.addImg(bangumi._imgUrl, bangumi.id);
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
        storage.addBangumi(item.id, item);
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
        storage.addPage(url);
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
      const id = storage.getImgId(imgUrl);
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
          logger.info(
            `[CACHE] cannot found ${source_duplicate} in cache, skip copy`,
          );
        }
      }
      if (existsSync(source)) {
        await copyFile(source, destination);
      } else {
        logger.info(`[CACHE] cannot found ${source} in cache, skip copy`);
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
  logger.info(`Restore ${imgUrlsFromCache.length} images from cache`);
  writeImgUrlsCacheList(imgUrlsAll);
  return imgUrlsFromSource;
}

export default async function crawler() {
  try {
    logger.info("Fetch Bangumi Index...");
    await IndexCrawler.run(INDEX_URL_LIST);

    logger.info("Fetch Bangumi List...");
    await ContentCrawler.run(storage.getPageUrls());

    logger.info("Fetch Bangumi Content...");
    await BangumiCrawler.run(storage.generateBangumiUrls());

    storage.save();

    const allImgUrlsSize = storage.getImgSize();
    const imgsUrlsToFetch = await restoreImgCache(storage.getImgUrls());

    logger.info(
      `Fetch Bangumi Images, ${imgsUrlsToFetch.length} images needs to fetch...`,
    );
    await ImageCrawler.run(imgsUrlsToFetch);
    logger.info(
      `Complete fetch ${
        imgsUrlsToFetch.length - (allImgUrlsSize - storage.getImgSize())
      } images`,
    );
  } catch (err: any) {
    logger.error(`${err?.name}: ${err?.messsage}\n${err?.stack}`);
  }
}

crawler();
