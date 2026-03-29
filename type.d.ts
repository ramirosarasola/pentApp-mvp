import type { SvgProps } from "react-native-svg";
import type { FC } from "react";

declare global {
  interface TabIconProps {
    focused: boolean;
    Icon: FC<SvgProps>;
    label: string;
  }
}

export {};
