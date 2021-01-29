import { mount } from "enzyme";
import React from "react";
import { Provider } from "react-redux";
import Select from "react-select";

import { expect, it } from "@jest/globals";

import mockPopsicle from "../../MockPopsicle";
import reduxUtils from "../../redux-test-utils";

import { buildInnerHTML, clickMainMenuButton, mockChartJS, tick, tickUpdate, withGlobalJquery } from "../../test-utils";

import { clickBuilder } from "./create-test-utils";

const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");
const originalInnerWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "innerWidth");
const originalInnerHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "innerHeight");

function submit(res) {
  res.find("div.modal-footer").first().find("button").first().simulate("click");
}

describe("DataViewer tests", () => {
  let result, CreateColumn, CreateTransform;

  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
      configurable: true,
      value: 500,
    });
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
      configurable: true,
      value: 500,
    });
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 1205,
    });
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 775,
    });

    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        const { urlFetcher } = require("../../redux-test-utils").default;
        return urlFetcher(url);
      })
    );

    mockChartJS();

    jest.mock("popsicle", () => mockBuildLibs);
  });

  beforeEach(async () => {
    CreateTransform = require("../../../popups/create/CreateTransform").CreateTransform;
    CreateColumn = require("../../../popups/create/CreateColumn").ReactCreateColumn;
    const { DataViewer } = require("../../../dtale/DataViewer");

    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: "" }, store);
    result = mount(
      <Provider store={store}>
        <DataViewer />
      </Provider>,
      { attachTo: document.getElementById("content") }
    );
    await tick();
    clickMainMenuButton(result, "Build Column");
    await tickUpdate(result);
    clickBuilder(result, "Transform");
  });

  afterAll(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", originalOffsetHeight);
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", originalOffsetWidth);
    Object.defineProperty(window, "innerWidth", originalInnerWidth);
    Object.defineProperty(window, "innerHeight", originalInnerHeight);
  });

  it("DataViewer: build transform column", async () => {
    expect(result.find(CreateTransform).length).toBe(1);
    result
      .find(CreateTransform)
      .find(Select)
      .first()
      .instance()
      .onChange([{ value: "col1" }]);
    result.update();
    expect(result.find(CreateTransform).find(Select).first().prop("noOptionsMessage")()).toBe("No columns available!");
    expect(result.find(CreateTransform).find(Select).at(1).prop("noOptionsMessage")()).toBe(
      "No columns available for the following dtypes: int, float!"
    );
    result.find(CreateTransform).find(Select).at(1).instance().onChange({ value: "col2" });
    result.update();
    result.find(CreateTransform).find(Select).last().instance().onChange({ value: "mean" });
    result.update();
    submit(result);
    await tick();
    expect(result.find(CreateColumn).instance().state.cfg).toEqual({
      col: "col2",
      group: ["col1"],
      agg: "mean",
    });
    expect(result.find(CreateColumn).instance().state.name).toBe("col2_transform");
  });

  it("DataViewer: build transform cfg validation", () => {
    const { validateTransformCfg } = require("../../../popups/create/CreateTransform");
    expect(validateTransformCfg({ group: null })).toBe("Please select a group!");
    expect(validateTransformCfg({ col: null, group: ["col1"] })).toBe("Please select a column to transform!");
    expect(
      validateTransformCfg({
        col: "col1",
        group: ["col2"],
        agg: null,
      })
    ).toBe("Please select an aggregation!");
    expect(
      validateTransformCfg({
        col: "col1",
        group: ["col2"],
        agg: "mean",
      })
    ).toBeNull();
  });
});
