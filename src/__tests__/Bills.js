/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { screen, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import userEvent from "@testing-library/user-event";
import BillsContainer from "../containers/Bills.js";

import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore);
describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      //icone du vertical layout bien présent
      const windowIcon = await screen.getByTestId("icon-window");
      expect(windowIcon).toHaveClass("active-icon");
    });
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => new Date(b.date) - new Date(a.date);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
  });
  test("When I click on the button I should be redirected to the newBill page", async () => {
    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname });
    };
    const bills = new BillsContainer({
      document,
      onNavigate,
      mockStore,
      localStorage,
    });
    const handleClickNewBill = jest.fn((e) => bills.handleClickNewBill(e));
    const addNewBill = screen.getByTestId("btn-new-bill");
    addNewBill.addEventListener("click", handleClickNewBill);
    userEvent.click(addNewBill);
    expect(handleClickNewBill).toHaveBeenCalled();
    expect(screen.queryByText("Envoyer une note de frais")).toBeTruthy();
  });

  test("When i click on the button then the modal should be shown", async () => {
    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname });
    };
    document.body.innerHTML = BillsUI({ data: bills });
    const bills2 = new BillsContainer({
      document,
      onNavigate,
      localStorage: window.localStorage,
    });
    const handleClickIconEye = jest.fn((icon) =>
      bills2.handleClickIconEye(icon)
    );
    const modaleFile = document.getElementById("modaleFile");
    const iconEye = screen.getAllByTestId("icon-eye");
    $.fn.modal = jest.fn(() => modaleFile.classList.add("show"));
    iconEye.forEach((icon) => {
      icon.addEventListener("click", handleClickIconEye(icon));
      userEvent.click(icon);
      expect(handleClickIconEye).toHaveBeenCalled();
    });
    expect(modaleFile.classList.contains("show")).toBeTruthy();
  });
  test("Fetch from Mock API", async () => {
    localStorage.setItem("user", JSON.stringify({ type: "Employee" }));
    const root = document.createElement("div");
    root.setAttribute("id", "root");
    document.body.append(root);
    router();
    window.onNavigate(ROUTES_PATH.Bills);
    await waitFor(() => screen.getByText("Mes notes de frais"));
    const content1 = screen.getByText("encore");
    expect(content1).toBeDefined();
    const content2 = screen.getByText("test1");
    expect(content2).toBeDefined();
    const content3 = screen.getByText("test3");
    expect(content3).toBeTruthy();
    const content4 = screen.getByText("test2");
    expect(content4).toBeDefined();
    // Check if the 4 notes are here
    expect(screen.getAllByTestId("icon-eye").length).toEqual(4);
    // Check with the length
    expect(screen.getByText("Justificatif")).toBeVisible();
    // Check if the modal is ok
    expect(screen.getByTestId("btn-new-bill")).toHaveTextContent(
      "Nouvelle note de frais"
    );
    // Check if the button is here
    expect(screen.getByTestId("tbody")).toBeDefined();
    expect(screen.getByTestId("tbody")).toHaveTextContent("encore");
    expect(screen.getByTestId("tbody")).toHaveTextContent("test1");
    expect(screen.getByTestId("tbody")).toHaveTextContent("test3");
    expect(screen.getByTestId("tbody")).toHaveTextContent("test2");
    // Check if all the notes are okay
  });
  describe("When an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills");
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.appendChild(root);
      router();
    });
    test("Should fail and return a 404 err", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 404"));
          },
        };
      });
      window.onNavigate(ROUTES_PATH.Bills);
      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });

    test("Should fail and return a 500 err", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 500"));
          },
        };
      });

      window.onNavigate(ROUTES_PATH.Bills);
      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });
  });
});
