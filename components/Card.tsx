import Image from "next/image";
import { Dispatch, SetStateAction } from "react";
import { BangumiT } from "../hooks/useBangumi";

interface Props {
  item: BangumiT;
  open: boolean;
  setItem: Dispatch<SetStateAction<BangumiT | undefined>>;
  isFirst?: boolean;
}

export const Card = ({ item, setItem, open, isFirst = false }: Props) => {
  return (
    <div
      className="transition-all shrink-0"
      style={{
        gridColumn: open ? "span 4" : undefined,
        gridRow: open ? "span 3" : undefined,
      }}
    >
      {!open ? (
        <>
          <figure
            className="relative select-none cursor-pointer"
            style={{ width: 125, height: 170 }}
            onClick={() => setItem(open ? undefined : item)}
          >
            <Image
              src={`/img/${item.img.split("/").pop()}.avif`}
              alt={item.title}
              priority={isFirst}
              sizes="125px"
              fill
            />
          </figure>
          <h2 className="text-sm truncate mt-2 select-none" title={item.title}>
            {item.title}
          </h2>
          <p
            className="text-sm truncate w-full text-left select-none"
            title={item.statusText}
          >
            {item.statusText}
          </p>
        </>
      ) : (
        <div className="relative h-full flex flex-col gap-3">
          <div className="flex gap-3">
            <figure
              className="relative select-none shrink-0 cursor-pointer"
              style={{ width: 250, height: 350 }}
              onClick={() => setItem(open ? undefined : item)}
            >
              <Image
                src={`/img/${item.img.split("/").pop()}.avif`}
                alt={item.title}
                priority={isFirst}
                sizes="250px"
                fill
              />
            </figure>
            <div className="grow flex flex-col justify-between gap-2 border border-gray-400 text-sm p-3">
              <div className="grow flex flex-col gap-1">
                <h1>{item.title}</h1>
                <p>{item.statusTextLong}</p>
                <p>首播日期: {item.roadshow}</p>
                <p>原著作者: {item.originalAuthor.join("/")}</p>
                <p>
                  官方網站:{" "}
                  <a
                    target="_blank"
                    rel="noreferrer"
                    href={item.site}
                    className="hover:underline"
                  >
                    {item.site}
                  </a>
                </p>
              </div>
              <div className="flex justify-end">
                <a
                  className="text-black bg-white py-3 px-5"
                  target="_blank"
                  rel="noreferrer"
                  href={`https://myself-bbs.com/thread-${item.id}-1-1.html`}
                >
                  前往網頁
                </a>
              </div>
            </div>
          </div>
          <div className="grow border border-gray-400 p-3 overflow-y-scroll">
            <p className="text-sm leading-relaxed">{item.info}</p>
          </div>
        </div>
      )}
    </div>
  );
};
