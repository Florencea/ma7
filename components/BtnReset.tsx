import { clsx } from "clsx";
import type { ButtonHTMLAttributes, DetailedHTMLProps } from "react";

export const BtnReset = ({
  disabled,
  ...props
}: DetailedHTMLProps<
  ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>) => {
  return (
    <button
      className={clsx(
        "w-[80px] cursor-pointer border border-gray-400 bg-transparent p-2 leading-none outline-none",
        {
          "text-gray-400": disabled,
        },
      )}
      {...props}
    />
  );
};
