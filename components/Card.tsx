import { Dispatch, SetStateAction } from "react";
import { BangumiT } from "./useBangumi";

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
    <div
      style={{
        flexShrink: 0,
        gridColumn: open ? "span 4" : undefined,
        gridRow: open ? "span 3" : undefined,
        userSelect: open ? undefined : "none",
      }}
    >
      {!open ? (
        <>
          <picture
            style={{
              width: 125,
              height: 175,
              position: "relative",
              userSelect: "none",
              cursor: "pointer",
            }}
            onClick={() => setCurrentBagumi(open ? undefined : bangumi)}
          >
            <source srcSet={`/img/${bangumi.id}.avif`} type="image/avif" />
            <img
              src={`/img/${bangumi.id}.avif`}
              alt={bangumi.title}
              style={{ width: 125, height: 175 }}
            />
          </picture>
          <div
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={bangumi.title}
          >
            {bangumi.title}
          </div>
          <div
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={bangumi.stat}
          >
            {bangumi.stat}
          </div>
        </>
      ) : (
        <div
          style={{
            position: "relative",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", gap: 12 }}>
            <picture
              style={{
                width: 250,
                height: 350,
                position: "relative",
                userSelect: "none",
                cursor: "pointer",
                flexShrink: 0,
              }}
              onClick={() => setCurrentBagumi(open ? undefined : bangumi)}
            >
              <source srcSet={`/img/${bangumi.id}.avif`} type="image/avif" />
              <img
                src={`/img/${bangumi.id}.avif`}
                alt={bangumi.title}
                style={{ width: 250, height: 350 }}
              />
            </picture>
            <div
              style={{
                flexGrow: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 8,
                border: "1px solid #fff",
                padding: 12,
              }}
            >
              <div
                style={{
                  flexGrow: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <div>{bangumi.title}</div>
                <div>
                  {bangumi.stat} {bangumi.total}
                </div>
                <div>ID: {bangumi.id}</div>
                <div>首播日期: {bangumi.start}</div>
                <div>原著作者: {bangumi.by}</div>
                <div>
                  官方網站:{" "}
                  <a
                    style={{ color: "white" }}
                    target="_blank"
                    rel="noreferrer"
                    href={bangumi.site}
                  >
                    {bangumi.site}
                  </a>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "end" }}>
                <a
                  style={{
                    color: "black",
                    backgroundColor: "white",
                    padding: "12px 20px",
                    textDecoration: "none",
                  }}
                  target="_blank"
                  rel="noreferrer"
                  href={`https://myself-bbs.com/thread-${bangumi.id}-1-1.html`}
                >
                  前往網頁
                </a>
              </div>
            </div>
          </div>
          <div
            style={{
              flexGrow: 1,
              border: "1px solid #fff",
              padding: 12,
              overflowY: "scroll",
            }}
          >
            {bangumi.info}
          </div>
        </div>
      )}
    </div>
  );
};
