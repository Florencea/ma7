import { CheerioCrawler, Configuration, HttpCrawler } from "crawlee";
import dayjs from "dayjs";
import CustomParseFormat from "dayjs/plugin/customParseFormat.js";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { copyFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import {
  BANGUMI_URL_TEMPLATE,
  BasicBangumiT,
  CACHE_DIR_PATH,
  CACHE_FILE_PATH,
  CRAWLER_CONFIG,
  CRAWLER_OPTIONS,
  DATE_FORMAT,
  DB_DIR_PATH,
  DB_PATH,
  IMAGE_404_LIST,
  IMAGE_DUPLICATEID_MAP,
  IMAGE_MIMETYPE,
  IMG_DIR_PATH,
  INDEX_URL_LIST,
  START_CORRECTION_MAP,
} from "./crawler-config";
import { ContentParser } from "./crawler-content-parser";
import { IndexParser } from "./crawler-index-parser";
dayjs.extend(CustomParseFormat);

let GLOBAL_INDEX_DB: Map<number, BasicBangumiT> = new Map();

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
      if (a.end !== b.end) {
        return a.end ? 1 : -1;
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
    .map(({ end, ...rest }) => rest);
  const db_json = JSON.stringify(db_data);
  mkdirSync(DB_DIR_PATH, { recursive: true });
  writeFileSync(DB_PATH, db_json);
  logger(`Complete fetch ${GLOBAL_INDEX_DB.size} Bangumis.`);
}

function getBangumiId(request_url: string) {
  const id_str = request_url.split("-")[2];
  const id = parseInt(id_str, 10);
  return id;
}

function getBangumiTitle($: cheerio.CheerioAPI) {
  const title = $("title").text().split("【")[0];
  return title;
}

function getBangumiImg($: cheerio.CheerioAPI) {
  const img = $(".info_img_box.fl > img").attr("src");
  return `${img}`;
}

function getBangumiInfo($: cheerio.CheerioAPI) {
  const info = $("#info_introduction_text").text();
  return info;
}

function getBangumiStart(id: number, $: cheerio.CheerioAPI) {
  if (START_CORRECTION_MAP.has(id)) {
    return `${START_CORRECTION_MAP.get(id)}`;
  } else {
    const start_str = $(".info_info > ul > li:nth-child(2)")
      .text()
      .split(": ")[1];
    const start = dayjs(start_str, "YYYY年MM月DD日").format(DATE_FORMAT);
    return start === "Invalid Date" ? "未知" : start;
  }
}

function getBangumiTotalEpisodes($: cheerio.CheerioAPI) {
  const totalEpisodes_str = $(".info_info > ul > li:nth-child(3)")
    .text()
    .split(": ")[1];
  const totalEpisodes =
    totalEpisodes_str === "未定"
      ? -1
      : parseInt(totalEpisodes_str.split(" ")[1], 10);
  return totalEpisodes;
}

function getBangumiBy($: cheerio.CheerioAPI) {
  const by_str = $(".info_info > ul > li:nth-child(4)").text().split(": ")[1];
  const by_arr = by_str.split("／");
  if (by_arr.length > 1) {
    return `${by_arr.join("/")}`;
  } else if (by_arr[0].split(" / ")[0] !== "") {
    return `${by_arr[0].split(" / ").join("/")}`;
  } else {
    return "";
  }
}

function getBangumiSite($: cheerio.CheerioAPI) {
  const site = $(".info_info > ul > li:nth-child(5) > a").attr("href");
  return site;
}

function isValidVideo(idStr: string) {
  return idStr.split("/player/")[0] === "https://v.myself-bbs.com";
}

function getBangumiEpisodes($: cheerio.CheerioAPI) {
  const episodes_arr = $(".main_list li:has(ul)")
    .map((_, el) => {
      const idStr = $(el).find("a[data-href*=myself]").attr("data-href") || "";
      if (isValidVideo(idStr)) {
        const title = $(el).find('li > a[href="javascript:;"]').text();
        return { title };
      } else {
        return { title: "" };
      }
    })
    .get() as { title: string }[];
  return episodes_arr;
}

function getBangumiTotal(end: boolean, totalEpisodes: number) {
  return end
    ? ""
    : `${
        (totalEpisodes ?? -1) < 0 ? "(總集數未定)" : `(共 ${totalEpisodes} 話)`
      }`;
}

function getBangumiStat(end: boolean, episodes: { title: string }[]) {
  return end ? "已完結" : `連載至 ${episodes[episodes.length - 1]?.title}`;
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
      const id = getBangumiId(request.url);
      const title = getBangumiTitle($);
      const imgUrl = getBangumiImg($);
      const info = getBangumiInfo($);
      const start = getBangumiStart(id, $);
      const totalEpisodes = getBangumiTotalEpisodes($);
      const by = getBangumiBy($);
      const site = getBangumiSite($);
      const episodes = getBangumiEpisodes($);
      const bangumi_index_data = GLOBAL_INDEX_DB.get(id) as BasicBangumiT;
      const total = getBangumiTotal(bangumi_index_data.end, totalEpisodes);
      const stat = getBangumiStat(bangumi_index_data.end, episodes);
      const bangumi_data = {
        ...bangumi_index_data,
        title,
        info,
        start,
        by,
        site,
        total,
        stat,
      };
      GLOBAL_INDEX_DB.set(id, bangumi_data);
      if (!IMAGE_404_LIST.includes(imgUrl)) {
        GLOBAL_IMG_URLS_MAP.set(imgUrl, id);
      }
    },
  },
  new Configuration(CRAWLER_OPTIONS),
);

const ContentCrawler = new CheerioCrawler(
  {
    ...CRAWLER_CONFIG,
    requestHandler: async ({ $ }) => {
      const contentParser = new ContentParser($);
      contentParser.parse(({ id, end }) => {
        GLOBAL_INDEX_DB.set(id, {
          id,
          end,
        });
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
