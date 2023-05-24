interface Props {
  label: React.ReactNode;
  children?: React.ReactNode;
  span2?: boolean;
  span3?: boolean;
  span4?: boolean;
  span5?: boolean;
}

export const Grid = ({
  label,
  children,
  span2,
  span3,
  span4,
  span5,
}: Props) => {
  return (
    <div
      className={`grow w-full flex flex-col justify-start items-start bg-neutral gap-3 p-3 col-span-1 ${
        span5
          ? "lg:col-span-5"
          : span4
          ? "lg:col-span-4"
          : span3
          ? "lg:col-span-3"
          : span2
          ? "lg:col-span-2"
          : ""
      }`}
    >
      <h3 className="text-lg font-bold flex justify-start items-center gap-3">
        {label}
      </h3>
      <div className="w-full text-sm leading-6">{children}</div>
    </div>
  );
};
