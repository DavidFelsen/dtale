import { mount } from "enzyme";
import React from "react";
import { Provider } from "react-redux";
import Select from "react-select";

import { expect, it } from "@jest/globals";

import DimensionsHelper from "../../DimensionsHelper";
import mockPopsicle from "../../MockPopsicle";
import reduxUtils from "../../redux-test-utils";

import { buildInnerHTML, clickMainMenuButton, mockChartJS, tick, tickUpdate, withGlobalJquery } from "../../test-utils";

describe("DataViewer tests", () => {
  const { location, open, opener } = window;
  const dimensions = new DimensionsHelper({
    offsetWidth: 800,
    offsetHeight: 500,
    innerWidth: 1205,
    innerHeight: 775,
  });
  let result, Reshape, Aggregate;

  beforeAll(() => {
    delete window.location;
    delete window.open;
    delete window.opener;
    dimensions.beforeAll();
    window.location = {
      reload: jest.fn(),
      pathname: "/dtale/column/1",
      assign: jest.fn(),
    };
    window.open = jest.fn();
    window.opener = { code_popup: { code: "test code", title: "Test" } };
    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        const { urlFetcher } = require("../../redux-test-utils").default;
        return urlFetcher(url);
      })
    );
    mockChartJS();
    jest.mock("popsicle", () => mockBuildLibs);

    Reshape = require("../../../popups/reshape/Reshape").ReactReshape;
    Aggregate = require("../../../popups/reshape/Aggregate").Aggregate;
  });

  beforeEach(async () => {
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
    clickMainMenuButton(result, "Summarize Data");
    await tickUpdate(result);
  });

  afterAll(() => {
    window.location = location;
    window.open = open;
    window.opener = opener;
    dimensions.afterAll();
  });

  it("DataViewer: reshape aggregate 'By Function'", async () => {
    result.find(Reshape).find("div.modal-body").find("button").first().simulate("click");
    expect(result.find(Aggregate).length).toBe(1);
    const aggComp = result.find(Aggregate).first();
    const aggInputs = aggComp.find(Select);
    aggInputs.first().instance().onChange({ value: "col1" });
    aggComp.find("button").last().simulate("click");
    aggInputs.at(1).instance().onChange({ value: "count" });
    aggInputs.at(2).instance().onChange({ value: "col2" });
    result.find("div.modal-body").find("div.row").last().find("button").last().simulate("click");
    result.find("div.modal-footer").first().find("button").first().simulate("click");
    await tick();
    result.find("div.modal-body").find("div.row").last().find("button").first().simulate("click");
    result.find("div.modal-footer").first().find("button").first().simulate("click");
    await tickUpdate(result);
    expect(result.find(Reshape).length).toBe(0);
  });
});
