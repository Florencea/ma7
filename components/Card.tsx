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
    <article className={open ? "open" : undefined}>
      {!open ? (
        <>
          <picture
            onClick={() => {
              setCurrentBagumi(bangumi);
            }}
          >
            <source srcSet={`/img/${bangumi.id}.avif`} type="image/avif" />
            <img src={`/img/${bangumi.id}.avif`} alt={bangumi.title} />
          </picture>
          <h1 title={bangumi.title}>{bangumi.title}</h1>
          <h2 title={bangumi.stat}>{bangumi.stat}</h2>
        </>
      ) : (
        <>
          <header>
            <picture
              onClick={() => {
                setCurrentBagumi(undefined);
              }}
            >
              <source srcSet={`/img/${bangumi.id}.avif`} type="image/avif" />
              <img src={`/img/${bangumi.id}.avif`} alt={bangumi.title} />
            </picture>
            <section>
              <ul>
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
              <footer>
                <a
                  target="_blank"
                  rel="noreferrer"
                  href={`https://myself-bbs.com/thread-${bangumi.id}-1-1.html`}
                >
                  前往網頁
                </a>
              </footer>
            </section>
          </header>
          <section>{bangumi.info}</section>
        </>
      )}
    </article>
  );
};
