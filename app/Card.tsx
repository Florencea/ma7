import { clsx } from "clsx";
import type { Dispatch, SetStateAction } from "react";
import type { BangumiT } from "./useBangumi";

interface Props {
  bangumi: BangumiT;
  currentBangumiState: [
    BangumiT | undefined,
    Dispatch<SetStateAction<BangumiT | undefined>>,
  ];
}

export const Card = ({
  bangumi,
  currentBangumiState: [currentBangumi, setCurrentBagumi],
}: Props) => {
  const open = currentBangumi?.id === bangumi.id;
  return (
    <article
      className={clsx("flex h-full w-[125px] shrink-0 flex-col", {
        "w-auto": open,
        "w-[125px]": !open,
        "col-span-4": open,
        "row-span-3": open,
        "gap-3": open,
        "pr-1": open,
      })}
    >
      {!open ? (
        <>
          <picture
            className="h-[175px] w-[125px] shrink-0 cursor-pointer select-none"
            onClick={() => {
              setCurrentBagumi(bangumi);
            }}
          >
            <source srcSet={`/img/${bangumi.id}.avif`} type="image/avif" />
            <img
              className="h-[175px] w-[125px] shrink-0 cursor-pointer select-none"
              src={`/img/${bangumi.id}.avif`}
              alt={bangumi.title}
            />
          </picture>
          <h1
            className="mt-2 overflow-hidden text-ellipsis whitespace-nowrap"
            title={bangumi.title}
          >
            {bangumi.title}
          </h1>
          <h2
            className="overflow-hidden text-ellipsis whitespace-nowrap text-gray-400"
            title={bangumi.stat}
          >
            {bangumi.stat}
          </h2>
        </>
      ) : (
        <>
          <header className="flex">
            <picture
              className="h-[350px] w-[250px] shrink-0 cursor-pointer select-none"
              onClick={() => {
                setCurrentBagumi(undefined);
              }}
            >
              <source srcSet={`/img/${bangumi.id}.avif`} type="image/avif" />
              <img src={`/img/${bangumi.id}.avif`} alt={bangumi.title} />
            </picture>
            <section className="flex grow flex-col justify-between gap-2 p-3">
              <ul className="flex grow list-none flex-col gap-1">
                <li>{bangumi.title}</li>
                <li>
                  {bangumi.stat} {bangumi.total}
                </li>
                <li>首播日期: {bangumi.start}</li>
                <li>原著作者: {bangumi.by}</li>
                <li>
                  官方網站:{" "}
                  <a target="_blank" rel="noreferrer" href={bangumi.site}>
                    {bangumi.site}
                  </a>
                </li>
              </ul>
              <footer className="flex justify-end">
                <a
                  className="border px-3 py-2"
                  target="_blank"
                  rel="noreferrer"
                  href={`https://myself-bbs.com/thread-${bangumi.id}-1-1.html`}
                >
                  前往網頁
                </a>
              </footer>
            </section>
          </header>
          <section className="grow leading-relaxed">{bangumi.info}</section>
        </>
      )}
    </article>
  );
};
