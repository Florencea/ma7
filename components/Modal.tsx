import Image from "next/image";
import { BangumiT } from "../hooks/useBangumi";
import { GET_STATUS_TEXT } from "./Card";
import { Grid } from "./Grid";

interface Props {
  item?: BangumiT;
  setItem: (item?: BangumiT) => void;
}

export const Modal = ({ item, setItem }: Props) => {
  return (
    <>
      <button
        className="btn btn-sm bg-transparent border-none absolute right-2 top-2"
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
                <span className="inline-block mb-2 truncate">{item.title}</span>
              ) : (
                ""
              )
            }
            span5
          >
            <div className="badge bg-transparent border-none">
              ID: {item?.id}
            </div>
            {GET_STATUS_TEXT(item)}
          </Grid>
          <Grid label="播出集數">
            {item?.totalEpisodes === -1
              ? "未定"
              : item?.totalEpisodes.toLocaleString()}
          </Grid>
          <Grid label="首播日期">{item?.roadshow}</Grid>
          <Grid label="觀看次數">{item?.view.toLocaleString()}</Grid>
          <Grid label="留言數">{item?.comment.toLocaleString()}</Grid>
          <Grid label="原著作者">{item?.originalAuthor.join("/")}</Grid>
          <Grid label="作品類型" span2>
            {item?.genre.map((g, i) => (
              <span className="badge bg-transparent border-none" key={i}>
                {g}
              </span>
            ))}
          </Grid>
          <Grid label="官方網站" span2>
            <a target="_blank" rel="noreferrer" href={item?.site}>
              {item?.site}
            </a>
          </Grid>
          <Grid label="播放">
            <a
              className="btn btn-sm btn-outline"
              target="_blank"
              rel="noreferrer"
              href={`https://myself-bbs.com/thread-${item?.id}-1-1.html`}
            >
              myself site ▶
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
