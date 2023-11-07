import dayjs from "dayjs";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { FullBangumiT } from "./crawler-config";
import { Logger } from "./crawler-logger";

export class Storage {
  private __dirname = process.cwd();
  private DB_DIR_PATH = join(this.__dirname, "public");
  private DB_PATH = join(this.DB_DIR_PATH, "data.json");
  private IMAGE_404_LIST = [
    "https://myself-bbs.com/data/attachment/forum/201607/09/1037264653qk9qn949kgqs.jpg",
  ];
  private storage: Map<number, FullBangumiT>;
  private pages: Set<string>;
  private imgs: Map<string, number>;
  private logger: Logger;
  constructor() {
    this.storage = new Map();
    this.pages = new Set();
    this.imgs = new Map();
    this.logger = new Logger();
  }
  public generateBangumiUrls() {
    return [...this.storage.keys()].map(
      (id) => `https://myself-bbs.com/thread-${id}-1-1.html`,
    );
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
    return [...this.pages.values()];
  }
  public addBangumi(id: number, bangumi: FullBangumiT) {
    this.storage.set(id, bangumi);
  }
  public addImg(imgUrl: string, id: number) {
    if (!this.IMAGE_404_LIST.includes(imgUrl)) {
      this.imgs.set(imgUrl, id);
    }
    this.imgs.set(imgUrl, id);
  }
  public getImgId(imgUrl: string) {
    return this.imgs.get(imgUrl)!;
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
      .map(({ _end, _imgUrl, ...rest }) => rest);
    const db_json = JSON.stringify(db_data);
    mkdirSync(this.DB_DIR_PATH, { recursive: true });
    writeFileSync(this.DB_PATH, db_json);
    this.logger.info(`Complete fetch ${this.storage.size} Bangumis.`);
  }
}
