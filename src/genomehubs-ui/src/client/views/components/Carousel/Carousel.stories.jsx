import Carousel from "./Carousel";
import { Provider } from "react-redux";
import React from "react";
import colorStore from "#reducers/color.store";

export default {
  title: "Components/Carousel",
  component: Carousel,
  decorators: [(story) => <Provider store={colorStore}>{story()}</Provider>],
};

const sampleItems = [
  {
    img: "https://picsum.photos/id/1015/1200/800",
    href: "https://example.com/1",
    title: "Mountain",
    description: "A scenic mountain landscape",
    tooltip: "Open mountain image in new window",
  },
  {
    img: "https://picsum.photos/id/1016/1200/800",
    href: "https://example.com/2",
    title: "Forest",
    description: "A tranquil forest",
  },
  {
    img: "https://picsum.photos/id/1018/1200/800",
    href: "https://example.com/3",
    title: "River",
    description: "A flowing river under sunlight",
  },
];

export const Default = () => (
  <div style={{ width: 640 }}>
    <Carousel items={sampleItems} ratio={16 / 9} duration={2000} />
  </div>
);

export const Empty = () => (
  <div style={{ width: 640 }}>
    <Carousel items={[]} />
  </div>
);
