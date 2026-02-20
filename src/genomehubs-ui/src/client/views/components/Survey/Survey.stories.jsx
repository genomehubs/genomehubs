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
    dismissable: { control: "boolean" },
    minWidth: { control: "text" },
    maxWidth: { control: "text" },
  },
};

const Template = (args) => {
  return (
    <Survey {...args}>
      <p>This is a survey example with customizable options.</p>
    </Survey>
  );
};

export const Default = Template.bind({});
Default.args = {
  id: "storybook-survey-default",
  title: "Storybook Survey",
  url: "https://example.com/survey",
  children: <p>This is a storybook survey example.</p>,
};

export const WithDismissible = Template.bind({});
WithDismissible.args = {
  id: "storybook-survey-dismissible",
  title: "Survey with Dismiss Options",
  dismissable: true,
  url: "https://example.com/survey",
  onDismissOnce: () => console.log("Dismissed once"),
  onDismissForever: () => console.log("Dismissed forever"),
};

export const WithFeedbackOptions = Template.bind({});
WithFeedbackOptions.args = {
  id: "storybook-survey-feedback",
  title: "Survey with Feedback Options",
  feedbackOptions: [
    { label: "Helpful", url: "https://example.com/feedback/helpful" },
    { label: "Not Helpful", url: "https://example.com/feedback/unhelpful" },
  ],
};

export const WithAllOptions = Template.bind({});
WithAllOptions.args = {
  id: "storybook-survey-all",
  title: "Survey with All Options",
  dismissable: true,
  url: "https://example.com/survey",
  onDismissOnce: () => console.log("Dismissed once"),
  onDismissForever: () => console.log("Dismissed forever"),
  onShowMore: () => console.log("Custom show more handler"),
  feedbackOptions: [
    { label: "Useful", url: "https://example.com/feedback/useful" },
    { label: "Feedback", url: "https://example.com/feedback" },
  ],
};

export const DismissibleOnly = Template.bind({});
DismissibleOnly.args = {
  id: "storybook-survey-dismiss-only",
  title: "Dismiss Only Survey",
  dismissable: true,
  onDismissOnce: () => console.log("Dismissed once"),
  onDismissForever: () => console.log("Dismissed forever"),
};

export const LearnMoreOnly = Template.bind({});
LearnMoreOnly.args = {
  id: "storybook-survey-learn-more",
  title: "Learn More Survey",
  url: "https://example.com/survey",
  onShowMore: () => console.log("Opening survey..."),
};

export const CustomWidths = Template.bind({});
CustomWidths.args = {
  id: "storybook-survey-custom-widths",
  title: "Survey with Custom Widths",
  minWidth: "400px",
  maxWidth: "1200px",
  url: "https://example.com/survey",
};

export const NoTitle = Template.bind({});
NoTitle.args = {
  id: "storybook-survey-no-title",
  url: "https://example.com/survey",
  dismissable: true,
  onDismissOnce: () => console.log("Dismissed once"),
  onDismissForever: () => console.log("Dismissed forever"),
};
