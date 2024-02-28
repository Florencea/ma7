import { clsx } from "clsx";

interface Props {
  disabled?: boolean;
  children?: React.ReactNode;
}

export const CountBox = ({ disabled = true, children = 0 }: Props) => {
  return (
    <div
      className={clsx(
        "w-[50px] cursor-default select-none p-2 text-right leading-none",
        { "text-gray-400": disabled },
      )}
    >
      {children}
    </div>
  );
};
