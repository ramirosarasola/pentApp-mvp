import type { FC } from "react";
import type { SvgProps } from "react-native-svg";
import { TabIcons } from "./icons";

export type TabConfig = {
  name: "index" | "garage" | "connect" | "assistant";
  title: string;
  Icon: FC<SvgProps>;
};

export const tabs: readonly TabConfig[] = [
  {
    name: "index",
    title: "Home",
    Icon: TabIcons.home,
  },
  {
    name: "garage",
    title: "Garage",
    Icon: TabIcons.garage,
  },
  {
    name: "connect",
    title: "Connect",
    Icon: TabIcons.connect,
  },
  {
    name: "assistant",
    title: "AI",
    Icon: TabIcons.assistant,
  },
];
