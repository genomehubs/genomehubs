import React from "react";
import AggregationIcon from "../components/AggregationIcon";
import { Provider } from "react-redux";
import store from "../reducers/color.store"; // Update this based on actual store path

export default {
  title: "Components/AggregationIcon",
  component: AggregationIcon,
  decorators: [
    (Story) => (
      <Provider store={store}>
        <Story />
      </Provider>
    ),
  ],
  argTypes: {
    method: {
      control: { type: "select" },
      options: ["direct", "descendant", "ancestor"],
    },
    hasDescendants: {
      control: { type: "boolean" },
    },
    statusColors: {
      control: "object",
    },
  },
};

const Template = (args) => <AggregationIcon {...args} />;

export const Direct = Template.bind({});
Direct.args = {
  method: "direct",
  hasDescendants: false,
  statusColors: { direct: "green", descendant: "orange", ancestor: "red" },
};

export const Descendant = Template.bind({});
Descendant.args = {
  method: "descendant",
  hasDescendants: true,
  statusColors: { direct: "green", descendant: "orange", ancestor: "red" },
};

export const Ancestor = Template.bind({});
Ancestor.args = {
  method: "ancestor",
  hasDescendants: false,
  statusColors: { direct: "green", descendant: "orange", ancestor: "red" },
};
