import { Provider } from "react-redux";
import Survey from "./Survey";
import colorStore from "#reducers/color.store";

export default {
  title: "Components/Survey",
  component: Survey,
  decorators: [(story) => <Provider store={colorStore}>{story()}</Provider>],
  argTypes: {
    id: { control: "text" },
    title: { control: "text" },
    url: { control: "text" },
  },
};

const Template = (args) => {
  return (
    <Survey
      {...args}
      id={"storybook-survey"}
      title={"Storybook survey"}
      url={"https://example.com/survey"}
    >
      <p>This is a storybook survey example.</p>
    </Survey>
  );
};

export const Default = Template.bind({});
