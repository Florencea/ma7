import { CheerioCrawler, Configuration, HttpCrawler } from "crawlee";
import dayjs from "dayjs";
import CustomParseFormat from "dayjs/plugin/customParseFormat.js";
import { copyFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { BangumiParser } from "./crawler-bangumi-parser";
import {
  CACHE_DIR_PATH,
  CRAWLER_CONFIG,
  CRAWLER_OPTIONS,
  IMAGE_DUPLICATEID_MAP,
  IMAGE_MIMETYPE,
  IMG_DIR_PATH,
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
      bangumiParser.parse((id, bangumi) => storage.addBangumi(id, bangumi));
    },
  },
  new Configuration(CRAWLER_OPTIONS),
);

const ContentCrawler = new CheerioCrawler(
  {
    ...CRAWLER_CONFIG,
    requestHandler: async ({ $ }) => {
      const contentParser = new ContentParser($);
      contentParser.parse((id, bangumi) => storage.addBangumi(id, bangumi));
    },
  },
  new Configuration(CRAWLER_OPTIONS),
);

const IndexCrawler = new CheerioCrawler(
  {
    ...CRAWLER_CONFIG,
    requestHandler: async ({ request, $ }) => {
      const indexParser = new IndexParser(request, $);
      indexParser.parse((url) => storage.addPage(url));
    },
  },
  new Configuration(CRAWLER_OPTIONS),
);

export default async function crawler() {
  await IndexCrawler.run(storage.getIndexUrls());
  await ContentCrawler.run(storage.getPageUrls());
  await BangumiCrawler.run(storage.generateBangumiUrls());
  await storage.save();
  await storage.restoreImgCache();
  await ImageCrawler.run(storage.getFetchImgUrls());
  await storage.logImgFetchResult();
}

crawler();
