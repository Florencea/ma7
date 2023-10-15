import Image from "next/image";
import { BangumiT } from "../hooks/useBangumi";
import { GET_STATUS_TEXT_LONG } from "./Card";
import { Grid } from "./Grid";

interface Props {
  item?: BangumiT;
  setItem: (item?: BangumiT) => void;
}

export const Modal = ({ item, setItem }: Props) => {
  return (
    <>
      <button
        className="btn text-lg bg-transparent border-none absolute right-2 top-2 rounded-full"
        onClick={() => {
          setItem(undefined);
        }}
      >
        ✕
      </button>
      <div className="flex flex-col lg:flex-row justify-start items-center lg:items-start gap-3">
        <div className="shrink-0">
          {item ? (
            <Image
              className="rounded-lg"
              src={`/img/${item?.img.split("/").pop()}.avif`}
              alt={item?.title ?? ""}
              width={250}
              height={350}
            />
          ) : null}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-[1px]">
          <Grid
            label={
              item ? (
                <span className="inline-block mb-2">{item.title}</span>
              ) : (
                ""
              )
            }
            span5
          >
            <div className="badge bg-transparent border-none">
              ID: {item?.id}
            </div>
            {GET_STATUS_TEXT_LONG(item)}
          </Grid>
          <Grid label="首播日期">{item?.roadshow}</Grid>
          <Grid label="原著作者">{item?.originalAuthor.join("/")}</Grid>
          <Grid label="官方網站" span2>
            <a
              target="_blank"
              rel="noreferrer"
              href={item?.site}
              className="hover:underline"
            >
              {item?.site}
            </a>
          </Grid>
          <Grid label="播放">
            <a
              className="btn btn-sm btn-outline rounded-full"
              target="_blank"
              rel="noreferrer"
              href={`https://myself-bbs.com/thread-${item?.id}-1-1.html`}
            >
              前往網頁
            </a>
          </Grid>
          <Grid label="簡介" span5>
            {item?.info}
          </Grid>
        </div>
      </div>
    </>
  );
};
