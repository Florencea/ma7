import { CheerioCrawler, Configuration, HttpCrawler } from "crawlee";
import { BangumiParser } from "./crawler-bangumi-parser";
import { ContentParser } from "./crawler-content-parser";
import { IndexParser } from "./crawler-index-parser";
import { Logger } from "./crawler-logger";
import { Storage } from "./crawler-storage";

const storage = new Storage();

const logger = new Logger();

const ImageCrawler = new HttpCrawler(
  {
    ...Storage.CRAWLER_CONFIG,
    additionalMimeTypes: Storage.IMAGE_MIMETYPE,
    requestHandler: async ({ request, body, response }) => {
      try {
        await storage.saveImg(request, body);
      } catch {
        storage.removeImg(request.url);
        const { statusCode, statusMessage } = response;
        logger.error(
          `[retry ${request.retryCount}] [${statusCode}: ${statusMessage}] ${request.url}`,
        );
      }
    },
  },
  new Configuration(Storage.CRAWLER_OPTIONS),
);

const BangumiCrawler = new CheerioCrawler(
  {
    ...Storage.CRAWLER_CONFIG,
    requestHandler: ({ request, $ }) => {
      const bangumiParser = new BangumiParser(request, $, storage.getStorage());
      bangumiParser.parse((id, bangumi) => {
        storage.addBangumi(id, bangumi);
      });
    },
  },
  new Configuration(Storage.CRAWLER_OPTIONS),
);

const ContentCrawler = new CheerioCrawler(
  {
    ...Storage.CRAWLER_CONFIG,
    requestHandler: ({ $ }) => {
      const contentParser = new ContentParser($);
      contentParser.parse((id, bangumi) => {
        storage.addBangumi(id, bangumi);
      });
    },
  },
  new Configuration(Storage.CRAWLER_OPTIONS),
);

const IndexCrawler = new CheerioCrawler(
  {
    ...Storage.CRAWLER_CONFIG,
    requestHandler: ({ request, $ }) => {
      const indexParser = new IndexParser(request, $);
      indexParser.parse((url) => {
        storage.addPage(url);
      });
    },
  },
  new Configuration(Storage.CRAWLER_OPTIONS),
);

export default async function crawler() {
  await IndexCrawler.run(storage.getIndexUrls());
  await ContentCrawler.run(storage.getPageUrls());
  await BangumiCrawler.run(storage.generateBangumiUrls());
  storage.save();
  await storage.restoreImgCache();
  await ImageCrawler.run(storage.getFetchImgUrls());
  storage.logImgFetchResult();
}

function main() {
  void crawler();
}

main();
