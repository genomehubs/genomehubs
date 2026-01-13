import JSZip from "jszip";
import { Provider } from "react-redux";
import ReportMap from ".";
import store from "#reducers/color.store";

// Mock map data with country_code attributes for testing
const mockMap = {
  status: true,
  report: {
    map: {
      bounds: {
        stats: {
          geo: {
            bounds: {
              top_left: { lat: 55, lon: -10 },
              bottom_right: { lat: 40, lon: 15 },
            },
          },
        },
        cats: [{ key: "FR" }, { key: "DE" }, { key: "ES" }],
      },
      map: {
        rawData: {
          FR: [{ country_code: ["FR"] }],
          DE: [{ country_code: ["DE"] }, { country_code: ["DE"] }],
          ES: [{ country_code: ["ES"] }],
          JP: [{ country_code: ["JP"] }],
        },
      },
    },
  },
};

export default {
  title: "Components/ReportMap",
  decorators: [
    (Story) => (
      <Provider store={store}>
        <Story />
      </Provider>
    ),
  ],
  component: ReportMap,
};

const Template = (args) => (
  <div style={{ width: 600, height: 400 }}>
    <ReportMap {...args} />
  </div>
);

export const GeoJSONIntegration = Template.bind({});
GeoJSONIntegration.args = {
  map: mockMap,
  chartRef: null,
  containerRef: null,
  searchIndexPlural: "taxa",
  embedded: false,
  ratio: 1,
  stacked: false,
  message: null,
  setMessage: () => {},
  colors: ["#fec44f", "#a1dab4", "#41b6c4"],
  levels: [],
  colorPalette: "default",
  palettes: {},
  minDim: 300,
  setMinDim: () => {},
  xOpts: {},
  basename: "",
};
