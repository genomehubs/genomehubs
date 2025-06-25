import MenuIcon from "@mui/icons-material/Menu";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import { Provider } from "react-redux";
import React from "react";
import ReportMenu from "./ReportMenu";
import colorStore from "../../reducers/color.store";
import { themeFromContext } from "../../../../.storybook/functions/themeFromContext";
export default {
  title: "Components/ReportMenu",
  decorators: [(story) => <Provider store={colorStore}>{story()}</Provider>],
  component: ReportMenu,
  args: {
    nightMode: false,
    theme: "lightTheme",
  },
};

const Template = (args) => (
  <div style={{ width: 600, height: 400 }}>
    <ReportMenu {...args} />
  </div>
);

export const Default = Template.bind({});
Default.args = {
  nightMode: false,
  toggleOpenIcon: <MenuIcon />,
  toggleClosedIcon: <MenuOpenIcon />,
  position: "top-right",
  children: <div>Example content</div>,
};

export const NightMode = Template.bind({});
NightMode.args = {
  ...Default.args,
  nightMode: true,
  toggleOpenIcon: <MenuIcon />,
  toggleClosedIcon: <MenuOpenIcon />,
};

export const BottomLeft = Template.bind({});
BottomLeft.args = {
  ...Default.args,
  position: "bottom-left",
  toggleOpenIcon: <MenuIcon />,
  toggleClosedIcon: <MenuOpenIcon />,
};

export const closeIcon = Template.bind({});
closeIcon.args = {
  ...Default.args,
  onClose: () => alert("Menu closed!"),
};
