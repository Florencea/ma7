import type {
  CheerioCrawlerOptions,
  ConfigurationOptions,
  Request,
} from "crawlee";
import dayjs from "dayjs";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { copyFile } from "node:fs/promises";
import { join } from "node:path";
import type { FormatEnum } from "sharp";
import sharp from "sharp";
import { Logger } from "./crawler-logger";

export interface FullBangumiT {
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
}

export class Storage {
  public static CRAWLER_CONFIG: CheerioCrawlerOptions = {
    maxConcurrency: 50,
    maxRequestRetries: 3,
    requestHandlerTimeoutSecs: 30,
    retryOnBlocked: true,
  };
  public static CRAWLER_OPTIONS: ConfigurationOptions = {
    logLevel: 1,
    persistStorage: false,
  };
  public static IMAGE_MIMETYPE = [
    "image/jpeg",
    "image/png",
    "image/avif",
    "image/webp",
    "image/bmp",
    "image/gif",
  ];
  private CURRENT_DIR = join(__dirname, "..");
  private DB_DIR_PATH = join(this.CURRENT_DIR, "public");
  private DB_PATH = join(this.DB_DIR_PATH, "data.json");
  private IMG_DIR_PATH = join(this.DB_DIR_PATH, "img");
  private CACHE_DIR_PATH = join(this.CURRENT_DIR, ".next", "cache", "img");
  private CACHE_FILE_PATH = join(this.CACHE_DIR_PATH, "cache.txt");
  private IMAGE_404_LIST = [
    "https://myself-bbs.com/data/attachment/forum/201607/09/1037264653qk9qn949kgqs.jpg",
  ];
  private IMAGE_DUPLICATEID_MAP = new Map([[45295, 45299]]);
  private ONAIR_URL = "https://myself-bbs.com/forum-133-1.html";
  private ENDED_URL = "https://myself-bbs.com/forum-113-1.html";
  private IMG_FORMAT: keyof FormatEnum = "avif";
  private storage: Map<number, FullBangumiT>;
  private pages: Set<string>;
  private imgs: Map<string, number>;
  private logger: Logger;
  private cachedImgUrls: string[];
  private copyImgUrls: string[];
  private fetchImgUrls: string[];
  private toCacheImgUrls: string[];
  private imgSizeBeforeFetch: number;
  constructor() {
    this.storage = new Map();
    this.pages = new Set();
    this.imgs = new Map();
    this.logger = new Logger();
    this.cachedImgUrls = this.loadCachedImgUrls();
    this.copyImgUrls = [];
    this.fetchImgUrls = [];
    this.toCacheImgUrls = [];
    this.imgSizeBeforeFetch = 0;
  }
  public generateBangumiUrls() {
    this.logger.info("Fetch Bangumi Content...");
    return [...this.storage.keys()].map(
      (id) => `https://myself-bbs.com/thread-${id}-1-1.html`,
    );
  }
  public getIndexUrls() {
    this.logger.info("Fetch Bangumi Index...");
    return [this.ONAIR_URL, this.ENDED_URL];
  }
  public getStorage() {
    return this.storage;
  }
  public getSize() {
    return this.storage.size;
  }
  public addPage(url: string) {
    this.pages.add(url);
  }
  public getPageUrls() {
    this.logger.info("Fetch Bangumi List...");
    return [...this.pages.values()];
  }
  public addBangumi(id: number, bangumi: FullBangumiT) {
    if (
      bangumi._imgUrl !== "" &&
      !this.IMAGE_404_LIST.includes(bangumi._imgUrl)
    ) {
      this.imgs.set(bangumi._imgUrl, id);
    }
    this.storage.set(id, bangumi);
  }
  public getImgId(imgUrl: string) {
    return this.imgs.get(imgUrl) ?? 0;
  }
  public getImgSize() {
    return this.imgs.size;
  }
  public removeImg(imgUrl: string) {
    this.imgs.delete(imgUrl);
  }
  public getImgUrls() {
    return [...this.imgs.keys()];
  }
  public save() {
    const rawData = [...this.storage.values()];
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
      .map(({ id, title, info, start, by, site, total, stat }) => ({
        id,
        title,
        info,
        start,
        by,
        site,
        total,
        stat,
      }));
    const db_json = JSON.stringify(db_data);
    mkdirSync(this.DB_DIR_PATH, { recursive: true });
    writeFileSync(this.DB_PATH, db_json);
    this.logger.info(`Complete fetch ${this.storage.size} Bangumis.`);
  }
  public getFetchImgUrls() {
    this.logger.info(
      `Fetch Bangumi Images, ${this.fetchImgUrls.length} images needs to fetch...`,
    );
    this.imgSizeBeforeFetch = this.imgs.size;
    return this.fetchImgUrls;
  }
  public async restoreImgCache() {
    this.pruneImgUrls();
    await this.copyImgFromCache();
    this.logger.info(`Restore ${this.copyImgUrls.length} images from cache`);
    this.writeImgUrlsCacheList();
  }
  public async saveImg(request: Request, body: string | Buffer) {
    const bangumiId = this.getImgId(request.url);
    const img = this.generateImgFileName(bangumiId);
    const { source, destination } = this.getPublicCopyParams(img);
    await sharp(body).toFormat(this.IMG_FORMAT).toFile(source);
    await this.safeCopy(source, destination);
    await this.saveDuplicateImg(bangumiId, body);
  }
  private async saveDuplicateImg(bangumiId: number, body: string | Buffer) {
    const bangumiIdDuplicate = this.IMAGE_DUPLICATEID_MAP.get(bangumiId);
    if (bangumiIdDuplicate) {
      const img = this.generateImgFileName(bangumiIdDuplicate);
      const { source, destination } = this.getPublicCopyParams(img);
      await sharp(body).toFormat(this.IMG_FORMAT).toFile(source);
      await this.safeCopy(source, destination);
    }
  }
  public logImgFetchResult() {
    this.logger.info(
      `Complete fetch ${
        this.fetchImgUrls.length - (this.imgs.size - this.imgSizeBeforeFetch)
      } images`,
    );
  }
  private loadCachedImgUrls() {
    mkdirSync(this.IMG_DIR_PATH, { recursive: true });
    mkdirSync(this.CACHE_DIR_PATH, { recursive: true });
    if (existsSync(this.CACHE_FILE_PATH)) {
      const cacheTxt = readFileSync(this.CACHE_FILE_PATH, {
        encoding: "utf-8",
      });
      return cacheTxt.split("\n");
    } else {
      return [];
    }
  }
  private pruneImgUrls() {
    const cached = new Set(this.cachedImgUrls);
    const current = new Set(this.getImgUrls());
    this.copyImgUrls = this.getIntersectionArr(current, cached);
    this.fetchImgUrls = this.getDifferenceArr(current, cached);
    this.toCacheImgUrls = this.getUnionArr(this.copyImgUrls, this.fetchImgUrls);
  }
  private async copyImgFromCache() {
    await Promise.all(
      this.copyImgUrls.map(async (imgUrl) => {
        const bangumiId = this.getImgId(imgUrl);
        const img = this.generateImgFileName(bangumiId);
        const { source, destination } = this.getCacheCopyParams(img);
        await this.handleDuplicateCacheImg(bangumiId);
        await this.safeCopy(source, destination);
      }),
    );
  }
  private writeImgUrlsCacheList() {
    const imgUrlsTxt = this.toCacheImgUrls.join("\n");
    writeFileSync(this.CACHE_FILE_PATH, imgUrlsTxt);
  }
  private async handleDuplicateCacheImg(bangumiId: number) {
    const bangumiIdDuplicate = this.IMAGE_DUPLICATEID_MAP.get(bangumiId);
    if (bangumiIdDuplicate) {
      const img = this.generateImgFileName(bangumiIdDuplicate);
      const { source, destination } = this.getCacheCopyParams(img);
      await this.safeCopy(source, destination);
    }
  }
  private getIntersectionArr<T>(a: Set<T>, b: Set<T>) {
    return [...a].filter((i) => b.has(i));
  }
  private getDifferenceArr<T>(a: Set<T>, b: Set<T>) {
    return [...a].filter((i) => !b.has(i));
  }
  private getUnionArr<T>(a: T[], b: T[]) {
    return [...new Set([...a, ...b])];
  }
  private getCacheCopyParams(file: string) {
    const source = join(this.CACHE_DIR_PATH, file);
    const destination = join(this.IMG_DIR_PATH, file);
    return { source, destination };
  }
  private getPublicCopyParams(file: string) {
    const source = join(this.IMG_DIR_PATH, file);
    const destination = join(this.CACHE_DIR_PATH, file);
    return { source, destination };
  }
  private async safeCopy(source: string, destination: string) {
    if (existsSync(source)) {
      await copyFile(source, destination);
    } else {
      this.logger.info(`[CACHE] cannot found ${source} in cache, skip copy`);
    }
  }
  private generateImgFileName(id: number) {
    return `${id}.${this.IMG_FORMAT}`;
  }
}
