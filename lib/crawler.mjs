import { CheerioCrawler, Configuration, HttpCrawler } from "crawlee";
import dayjs from "dayjs";
import CustomParseFormat from "dayjs/plugin/customParseFormat.js";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { copyFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import {
  BANGUMI_URL_TEMPLATE,
  CACHE_DIR_PATH,
  CACHE_FILE_PATH,
  COUNT_PER_PAGE,
  CRAWLER_CONFIG,
  CRAWLER_OPTIONS,
  DATE_FORMAT,
  DB_DIR_PATH,
  DB_PATH,
  ENDED_URL_TEMPLATE,
  IMAGE_DUPLICATEID_MAP,
  IMAGE_MIMETYPE,
  IMG_DIR_PATH,
  INDEX_URL_LIST,
  ONAIR_URL_TEMPLATE,
  START_CORRECTION_MAP,
} from "./config.mjs";
dayjs.extend(CustomParseFormat);

mkdirSync(IMG_DIR_PATH, { recursive: true });

/**
 * @type {Map<number, {
 *  id: number;
 *  end: number;
 *  start: string;
 * }>}
 */
let GLOBAL_INDEX_DB = new Map();
let GLOBAL_MAX_COUNT = 0;

/**
 * @type {Set<string>}
 */
const GLOBAL_PAGE_URLS_SET = new Set();
/**
 * @type {Map<string, number>}
 */
const GLOBAL_IMG_URLS_MAP = new Map();

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

/**
 * @param {string} content
 */
export function logger(content) {
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

/**
 * @param {string} index_url
 */
function isOnAirIndex(index_url) {
  return index_url.split("-")[2] === "133";
}

/**
 * @param {string} index_url
 * @param {number} max_page
 */
function getUrlSequence(index_url, max_page) {
  return isOnAirIndex(index_url)
    ? [...Array(max_page).keys()].map((i) => ONAIR_URL_TEMPLATE(i + 1))
    : [...Array(max_page).keys()].map((i) => ENDED_URL_TEMPLATE(i + 1));
}

/**
 * @param {cheerio.CheerioAPI} $
 */
function getMaxPage($) {
  const max_count_str = $("h1.xs2 > .xs1.xw0.i")
    .find("strong:last-child")
    .text();
  const max_count = parseInt(max_count_str, 10);
  GLOBAL_MAX_COUNT += max_count;
  const max_page = Math.ceil(max_count / COUNT_PER_PAGE);
  return max_page;
}

/**
 * @param {cheerio.CheerioAPI} $
 * @param {cheerio.Element} el
 */
function getId($, el) {
  const id_link = $(el).children("a").attr("href");
  const id_str = id_link.split("-")[1];
  const id = parseInt(id_str, 10);
  return id;
}

/**
 * @param {cheerio.CheerioAPI} $
 * @param {cheerio.Element} el
 */
function getEnd($, el) {
  const latest_info = $(el).find(".ep_info").text();
  const end_str = latest_info.split(" ")[0];
  return end_str === "全";
}

/**
 * @param {string} request_url
 */
function getBangumiId(request_url) {
  const id_str = request_url.split("-")[2];
  const id = parseInt(id_str, 10);
  return id;
}

/**
 * @param {cheerio.CheerioAPI} $
 */
function getBangumiTitle($) {
  const title = $("title").text().split("【")[0];
  return title;
}

/**
 * @param {cheerio.CheerioAPI} $
 */
function getBangumiImg($) {
  const img = $(".info_img_box.fl > img").attr("src");
  return `${img}`;
}

/**
 * @param {cheerio.CheerioAPI} $
 */
function getBangumiInfo($) {
  const info = $("#info_introduction_text").text();
  return info;
}

/**
 * @param {number} id
 * @param {cheerio.CheerioAPI} $
 */
function getBangumiStart(id, $) {
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

/**
 * @param {cheerio.CheerioAPI} $
 */
function getBangumiTotalEpisodes($) {
  const totalEpisodes_str = $(".info_info > ul > li:nth-child(3)")
    .text()
    .split(": ")[1];
  const totalEpisodes =
    totalEpisodes_str === "未定"
      ? -1
      : parseInt(totalEpisodes_str.split(" ")[1], 10);
  return totalEpisodes;
}

/**
 * @param {cheerio.CheerioAPI} $
 */
function getBangumiBy($) {
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

/**
 * @param {cheerio.CheerioAPI} $
 */
function getBangumiSite($) {
  const site = $(".info_info > ul > li:nth-child(5) > a").attr("href");
  return site;
}

/**
 * @param {string} idStr
 */
function isValidVideo(idStr) {
  return idStr.split("/player/")[0] === "https://v.myself-bbs.com";
}

/**
 * @param {cheerio.CheerioAPI} $
 * @returns {{ title: string }[]}
 */
function getBangumiEpisodes($) {
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
    .get();
  return episodes_arr;
}

/**
 * @param {boolean} end
 * @param {{ title: string }[]} episodes
 * @param {number} totalEpisodes
 */
function getBangumiTotal(end, totalEpisodes) {
  return end
    ? ""
    : `${
        (totalEpisodes ?? -1) < 0 ? "(總集數未定)" : `(共 ${totalEpisodes} 話)`
      }`;
}

/**
 * @param {boolean} end
 * @param {{ title: string }[]} episodes
 */
function getBangumiStat(end, episodes) {
  return end ? "已完結" : `連載至 ${episodes[episodes.length - 1]?.title}`;
}

const ImageCrawler = new HttpCrawler(
  {
    ...CRAWLER_CONFIG,
    additionalMimeTypes: IMAGE_MIMETYPE,
    requestHandler: async ({ request, body, response }) => {
      try {
        const id = GLOBAL_IMG_URLS_MAP.get(request.url);
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
      } catch (err) {
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
      const bangumi_index_data = GLOBAL_INDEX_DB.get(id);
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
      GLOBAL_IMG_URLS_MAP.set(imgUrl, id);
    },
  },
  new Configuration(CRAWLER_OPTIONS),
);

const ContentCrawler = new CheerioCrawler(
  {
    ...CRAWLER_CONFIG,
    requestHandler: async ({ $ }) => {
      $("div.c.cl").each((_, el) => {
        const id = getId($, el);
        const end = getEnd($, el);
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
      getUrlSequence(request.url, getMaxPage($)).forEach((url) =>
        GLOBAL_PAGE_URLS_SET.add(url),
      );
    },
  },
  new Configuration(CRAWLER_OPTIONS),
);
/**
 * @returns {string[]}
 */
function loadCachedImgUrls() {
  mkdirSync(CACHE_DIR_PATH, { recursive: true });
  if (existsSync(CACHE_FILE_PATH)) {
    const cacheTxt = readFileSync(CACHE_FILE_PATH, { encoding: "utf-8" });
    return cacheTxt.split("\n");
  } else {
    return [];
  }
}
/**
 * @param {string[]} cachedImgUrls
 * @param {string[]} currentImgUrls
 **/
function pruneImgUrls(cachedImgUrls, currentImgUrls) {
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

/**
 * @param {string[]} imgUrls
 */
async function copyImgFromCache(imgUrls) {
  await Promise.all(
    imgUrls.map(async (imgUrl) => {
      const id = GLOBAL_IMG_URLS_MAP.get(imgUrl);
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

/**
 * @param {string[]} imgUrls
 */
function writeImgUrlsCacheList(imgUrls) {
  const imgUrlsTxt = imgUrls.join("\n");
  writeFileSync(CACHE_FILE_PATH, imgUrlsTxt);
}

/**
 *
 * @param {string[]} currentImgUrls
 */
async function restoreImgCache(currentImgUrls) {
  const cachedImgUrls = loadCachedImgUrls();
  logger(`Load cache list: ${cachedImgUrls.length} images`);
  const { imgUrlsFromCache, imgUrlsFromSource, imgUrlsAll } = pruneImgUrls(
    cachedImgUrls,
    currentImgUrls,
  );
  logger(`Restore from cache...`);
  await copyImgFromCache(imgUrlsFromCache);
  logger(`Complete restore ${imgUrlsFromCache.length} images`);
  writeImgUrlsCacheList(imgUrlsAll);
  logger(`Complete write ${imgUrlsAll.length} images to cache list`);
  return imgUrlsFromSource;
}

/**
 * @param {string[]} index_url_arr
 */
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
  } catch (err) {
    logger(`${err.name}: ${err.messsage}\n${err.stack}`);
  }
}

crawler();
