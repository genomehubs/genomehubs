import ReportCaption from "./ReportCaption";
import { Provider } from "react-redux";
import React from "react";
import combinedStore from "../reducers/combinedStore";
import { themeFromContext } from "../../../../.storybook/functions/themeFromContext";
import { theme } from "../reducers/color";

const meta = {
  component: ReportCaption,
  decorators: [(story) => <Provider store={combinedStore}>{story()}</Provider>],
  tags: ["autodocs"],
  args: {
    caption: "This is a sample report caption with **highlighted** text.",
    embedded: false,
    inModal: false,
    padding: 2,
    reportById: {
      report: {
        tree: {
          phylopics: {} 
        }
      }
    }
  },
};

export default meta;

export const Default = (inputArgs, context) => (
  <ReportCaption {...inputArgs} theme={themeFromContext(context)} />
);


export const LongCaption = (inputArgs, context) => {
  const args = {
    ...inputArgs,
    caption: "This is a very long caption that will demonstrate the truncation behavior. It contains **highlighted** terms and continues with more text to ensure it exceeds the available space and triggers the ellipsis. The quick brown fox jumps over the lazy dog. Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    theme: themeFromContext(context)
  };
  return <ReportCaption {...args} />;
};


export const InModal = (inputArgs, context) => {
  const args = {
    ...inputArgs,
    inModal: true,
    caption: "This is a long caption that would normally be truncated, but since it's in modal view, the entire text should be visible. It contains **highlighted** terms and continues with more text.",
    theme: themeFromContext(context)
  };
  return <ReportCaption {...args} />;
};


export const Embedded = (inputArgs, context) => {
  const args = {
    ...inputArgs,
    embedded: true,
    caption: "This caption is displayed in embedded mode which affects its scaling behavior. It contains **highlighted** text.",
    theme: themeFromContext(context)
  };
  return <ReportCaption {...args} />;
};

export const WithPadding = (inputArgs, context) => {
  const args = {
    ...inputArgs,
    padding: 20,
    caption: "This caption has extra padding applied. It contains **highlighted** text.",
    theme: themeFromContext(context)
  };
  return <ReportCaption {...args} />;
};
export const WithPhylopics = (inputArgs, context) => {
  const taxonId = "123456";
  
  combinedStore.dispatch({
    type: "phylopics/receivePhylopic",
    payload: {
      taxonId,
      attribution: "Mock Attribution",
      fileUrl: "https://static.vecteezy.com/system/resources/previews/015/152/952/original/url-icon-design-for-web-interfaces-and-applications-png.png",
      dataUri: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiB2aWV3Qm94PSIwIDAgMTI0IDEyNCIgZmlsbD0ibm9uZSI+CjxyZWN0IHdpZHRoPSIxMjQiIGhlaWdodD0iMTI0IiByeD0iMjQiIGZpbGw9IiNGOTczMTYiLz4KPHBhdGggZD0iTTE5LjM3NSAzNi43ODE4VjEwMC42MjVDMTkuMzc1IDEwMi44MzQgMjEuMTY1OSAxMDQuNjI1IDIzLjM3NSAxMDQuNjI1SDg3LjIxODFDOTAuNzgxOCAxMDQuNjI1IDkyLjU2NjQgMTAwLjMxNiA5MC4wNDY2IDk3Ljc5NjZMMjYuMjAzNCAzMy45NTM0QzIzLjY4MzYgMzEuNDMzNiAxOS4zNzUgMzMuMjE4MiAxOS4zNzUgMzYuNzgxOFoiIGZpbGw9IndoaXRlIi8+CjxjaXJjbGUgY3g9IjYzLjIxMDkiIGN5PSIzNy41MzkxIiByPSIxOC4xNjQxIiBmaWxsPSJibGFjayIvPgo8cmVjdCBvcGFjaXR5PSIwLjQiIHg9IjgxLjEzMjgiIHk9IjgwLjcxOTgiIHdpZHRoPSIxNy41Njg3IiBoZWlnaHQ9IjE3LjM4NzYiIHJ4PSI0IiB0cmFuc2Zvcm09InJvdGF0ZSgtNDUgODEuMTMyOCA4MC43MTk4KSIgZmlsbD0iI0ZEQkE3NCIvPgo8L3N2Zz4=",
      source: "PhyloPic", 
      sourceUrl: "https://phylopic.org/image/123456",
      license: {
        href: "https://creativecommons.org/licenses/by/4.0/",
        name: "CC BY 4.0"
      },
      ratio: 1.5,
      imageName: "Example Species",
      imageRank: "species",
      scientificName: "Example Species"
    }
  });

  const args = {
    ...inputArgs,
    reportById: {
      report: {
        tree: {
          phylopics: {
            [taxonId]: { scientificName: "Example Species" }
          }
        }
      }
    },
    theme: themeFromContext(context)
  };
  
  return <ReportCaption {...args} />;
};

export const MultipleHighlights = (inputArgs, context) => {
  const args = {
    ...inputArgs,
    caption: "This caption contains **multiple** highlighted terms at **different** points in the text to test **formatting**.",
    theme: themeFromContext(context)
  };
  return <ReportCaption  {...args} />;
};
