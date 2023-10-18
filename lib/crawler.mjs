import { CheerioCrawler, Configuration, HttpCrawler } from "crawlee";
import dayjs from "dayjs";
import CustomParseFormat from "dayjs/plugin/customParseFormat.js";
import { mkdirSync, writeFileSync } from "node:fs";
import sharp from "sharp";
import {
  BANGUMI_URL_TEMPLATE,
  COUNT_PER_PAGE,
  CRAWLER_CONFIG,
  CRAWLER_OPTIONS,
  DATE_FORMAT,
  DB_DIR_PATH,
  DB_PATH,
  ENDED_URL_TEMPLATE,
  IMAGE_MIMETYPE,
  INDEX_URL_LIST,
  ONAIR_URL_TEMPLATE,
} from "./config.mjs";
dayjs.extend(CustomParseFormat);

mkdirSync("public/img", { recursive: true });

/**
 * @type {Map<number, {
 *  id: number;
 *  title: string;
 *  end: number;
 * }>}
 */
let GLOBAL_INDEX_DB = new Map();
/**
 * @type {Set<number>}
 */
let GLOBAL_INDEX_SET = new Set();
let GLOBAL_MAX_COUNT = 0;
let COMPLETE_CNT = 0;

let PAGE_URLS = [];
let BANGUME_URLS = [];
let IMAGE_URLS = [];

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
      // then by updated
      if (a.updated !== b.updated) {
        return a.updated > b.updated ? -1 : 1;
      }
      // default by id reverse
      return b.id - a.id;
    })
    .map(({ end, updated, ...rest }) => rest);
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
 * @returns {string[]}
 */
function getBangumiUrlSequence() {
  return [...GLOBAL_INDEX_DB.keys()].map((id) => BANGUMI_URL_TEMPLATE(id));
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
function getTitle($, el) {
  const title = $(el).children("a").attr("title");
  return title;
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
  return img;
}

/**
 * @param {cheerio.CheerioAPI} $
 */
function getBangumiInfo($) {
  const info = $("#info_introduction_text").text();
  return info;
}

/**
 * @param {cheerio.CheerioAPI} $
 */
function getBangumiRoadshow($) {
  const roadshow_str = $(".info_info > ul > li:nth-child(2)")
    .text()
    .split(": ")[1];
  const roadshow = dayjs(roadshow_str, "YYYY年MM月DD日").format(DATE_FORMAT);
  return roadshow;
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
function getBangumiOriginalAuthor($) {
  const originalAuthor_str = $(".info_info > ul > li:nth-child(4)")
    .text()
    .split(": ")[1];
  const originalAuthor_arr = originalAuthor_str.split("／");
  if (originalAuthor_arr.length > 1) {
    return originalAuthor_arr;
  } else if (originalAuthor_arr[0].split(" / ")[0] !== "") {
    return originalAuthor_arr[0].split(" / ");
  } else {
    return [];
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
function getStatusTextLong(end, episodes, totalEpisodes) {
  return end
    ? "已完結"
    : `連載至 ${episodes[episodes.length - 1]?.title}${
        (totalEpisodes ?? -1) < 0
          ? " (總集數未定)"
          : ` (共 ${totalEpisodes} 話)`
      }`;
}

/**
 * @param {boolean} end
 * @param {{ title: string }[]} episodes
 */
function getStatusText(end, episodes) {
  return end ? "已完結" : `連載至 ${episodes[episodes.length - 1]?.title}`;
}

const ImageCrawler = new HttpCrawler(
  {
    ...CRAWLER_CONFIG,
    additionalMimeTypes: IMAGE_MIMETYPE,
    requestHandler: async ({ request, body }) => {
      try {
        sharp(body)
          .toFormat("avif")
          .toFile(`public/img/${request.url.split("/").pop()}.avif`);
      } catch (err) {
        logger(`IMAGE failed to save ${request.url}\n ${err.message}`);
      }
    },
    errorHandler: (inputs, error) => {
      if (inputs.request.maxRetries === inputs.request.retryCount) {
        logger(
          `IMAGE failed to save ${inputs.request.url}\n[retry ${inputs.request.retryCount}] ${error.message}`,
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
      const img = getBangumiImg($);
      const info = getBangumiInfo($);
      const roadshow = getBangumiRoadshow($);
      const totalEpisodes = getBangumiTotalEpisodes($);
      const originalAuthor = getBangumiOriginalAuthor($);
      const site = getBangumiSite($);
      const episodes = getBangumiEpisodes($);
      const bangumi_index_data = GLOBAL_INDEX_DB.get(id);
      const statusTextLong = getStatusTextLong(
        bangumi_index_data.end,
        episodes,
      );
      const statusText = getStatusText(bangumi_index_data.end, episodes);
      const updated = now();
      const bangumi_data = {
        ...bangumi_index_data,
        img,
        info,
        roadshow,
        totalEpisodes,
        originalAuthor,
        site,
        statusTextLong,
        statusText,
        updated,
      };
      IMAGE_URLS.push(img);
      GLOBAL_INDEX_DB.set(id, bangumi_data);
      GLOBAL_INDEX_SET.add(id);
      if (GLOBAL_INDEX_DB.size === GLOBAL_INDEX_SET.size) {
        saveGlobalIndexDb();
      }
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
        const title = getTitle($, el);
        const end = getEnd($, el);
        GLOBAL_INDEX_DB.set(id, {
          id,
          title,
          end,
        });
      });
      if (GLOBAL_INDEX_DB.size === GLOBAL_MAX_COUNT) {
        const bangumi_url_sequence = getBangumiUrlSequence();
        BANGUME_URLS = [...BANGUME_URLS, ...bangumi_url_sequence];
      }
    },
  },
  new Configuration(CRAWLER_OPTIONS),
);

const IndexCrawler = new CheerioCrawler(
  {
    ...CRAWLER_CONFIG,
    requestHandler: async ({ request, $ }) => {
      const max_page = getMaxPage($);
      const url_sequence = getUrlSequence(request.url, max_page);
      PAGE_URLS = [...PAGE_URLS, ...url_sequence];
    },
  },
  new Configuration(CRAWLER_OPTIONS),
);

/**
 * @param {string[]} index_url_arr
 */
export default async function crawler() {
  logger("Fetch Bangumi Index...");
  await IndexCrawler.run(INDEX_URL_LIST);
  logger("Fetch Bangumi List...");
  await ContentCrawler.run(PAGE_URLS);
  logger("Fetch Bangumi Content...");
  await BangumiCrawler.run(BANGUME_URLS);
  logger("Fetch Bangumi Images...");
  await ImageCrawler.run(IMAGE_URLS);
}

crawler();
