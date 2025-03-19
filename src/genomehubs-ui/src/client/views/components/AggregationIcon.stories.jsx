import React from "react";
import AggregationIcon from "../components/AggregationIcon";
import { Provider } from "react-redux";
import store from "../reducers/color.store"; 

export default {
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
  },
};

const Template = (args) => <AggregationIcon {...args} />;

export const Direct = Template.bind({});
Direct.args = {
  method: "direct",
  hasDescendants: false,
};

export const DirectWithDescendants = Template.bind({});
DirectWithDescendants.args = {
  method: "direct",
  hasDescendants: true,
};

export const Descendant = Template.bind({});
Descendant.args = {
  method: "descendant",
  hasDescendants: false,
};

export const Ancestor = Template.bind({});
Ancestor.args = {
  method: "ancestor",
  hasDescendants: false,
};
