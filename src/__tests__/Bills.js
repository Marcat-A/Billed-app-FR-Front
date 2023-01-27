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
    test("When I click on the button, i should be redirect on the newBill page", async () => {
      // fonction qui permet de changer la page affichée
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      // instanciation de la classe gérant les factures
      const bills = new BillsContainer({
        document,
        onNavigate,
        mockStore,
        localStorage,
      });
      // fonction appelée lors du clic sur le bouton "Nouvelle facture"
      const handleClickNewBill = jest.fn((e) => bills.handleClickNewBill(e));
      // récupération du bouton
      const addNewBill = screen.getByTestId("btn-new-bill");
      // écouteur d'événement pour le clic sur le bouton
      addNewBill.addEventListener("click", handleClickNewBill);
      // simulation d'un clic sur le bouton
      userEvent.click(addNewBill);
      // vérification que la fonction handleClickNewBill a été appelée
      expect(handleClickNewBill).toHaveBeenCalled();
      // vérification que le texte "Envoyer une note de frais" est présent sur la page
      expect(screen.queryByText("Envoyer une note de frais")).toBeTruthy();
    });
    test("When I click on the button then the modal should be showed", async () => {
      // onNavigate est une fonction qui permet de changer l'affichage de la page en fonction du pathname
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      // On remplace le contenu de la page par celui généré par la fonction BillsUI avec les données fournies
      document.body.innerHTML = BillsUI({ data: bills });
      // On instancie un nouvel objet BillsContainer avec les propriétés document, onNavigate et localStorage
      const bills2 = new BillsContainer({
        document,
        onNavigate,
        localStorage: window.localStorage,
      });
      // On crée une fonction de rappel pour la fonction handleClickIconEye de l'objet bills2
      const handleClickIconEye = jest.fn((icon) =>
        bills2.handleClickIconEye(icon)
      );
      // On récupère l'élément HTML qui contiendra la fenêtre modale
      const modaleFile = document.getElementById("modaleFile");
      // On récupère tous les éléments qui ont l'attribut de test "icon-eye"
      const iconEye = screen.getAllByTestId("icon-eye");
      // On remplace la fonction modal de JQuery par une fonction qui ajoute la classe "show" à l'élément modaleFile
      $.fn.modal = jest.fn(() => modaleFile.classList.add("show"));
      // Pour chaque icône récupérée
      iconEye.forEach((icon) => {
        // On ajoute un écouteur d'événement click qui appelle la fonction handleClickIconEye avec l'icône en paramètre
        icon.addEventListener("click", handleClickIconEye(icon));
        // On simule un clic sur l'icône
        userEvent.click(icon);
        // On vérifie que la fonction handleClickIconEye a été appelée
        expect(handleClickIconEye).toHaveBeenCalled();
      });
      // On vérifie que l'élément modaleFile possède la classe "show"
      expect(modaleFile.classList.contains("show")).toBeTruthy();
    });
    test("Fetch from Mock API", async () => {
      // On définit un utilisateur de type "Employee" dans le localStorage
      localStorage.setItem("user", JSON.stringify({ type: "Employee" }));
      // On crée un élément HTML "div" avec un id "root"
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      // On ajoute cet élément au body de la page
      document.body.append(root);
      // On appelle la fonction "router" pour naviguer vers la page des notes de frais
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      // On attend que l'élément HTML contenant le texte "Mes notes de frais" soit affiché
      await waitFor(() => screen.getByText("Mes notes de frais"));
      // On vérifie si les éléments HTML contenant les textes "encore", "test1", "test2" et "test3" sont définis
      const content1 = screen.getByText("encore");
      expect(content1).toBeDefined();
      const content2 = screen.getByText("test1");
      expect(content2).toBeDefined();
      const content3 = screen.getByText("test3");
      expect(content3).toBeTruthy();
      const content4 = screen.getByText("test2");
      expect(content4).toBeDefined();
      // On vérifie si les 4 notes sont présentes en utilisant leur identifiant de test "icon-eye"
      expect(screen.getAllByTestId("icon-eye").length).toEqual(4);
      // On vérifie la présence du texte "Justificatif"
      expect(screen.getByText("Justificatif")).toBeVisible();
      // On vérifie si le bouton "Nouvelle note de frais" est présent et s'il contient le bon texte
      expect(screen.getByTestId("btn-new-bill")).toHaveTextContent(
        "Nouvelle note de frais"
      );
      // On vérifie si l'élément HTML "tbody" est défini
      expect(screen.getByTestId("tbody")).toBeDefined();
      // On vérifie si l'élément HTML "tbody" contient les textes "encore", "test1", "test2" et "test3"
      expect(screen.getByTestId("tbody")).toHaveTextContent("encore");
      expect(screen.getByTestId("tbody")).toHaveTextContent("test1");
      expect(screen.getByTestId("tbody")).toHaveTextContent("test3");
      expect(screen.getByTestId("tbody")).toHaveTextContent("test2");
    });
    describe("When an error occurs on the API", () => {
      beforeEach(() => {
        // On espionne la fonction "bills" de l'objet mockStore
        jest.spyOn(mockStore, "bills");
        // On définit une propriété "localStorage" pour la fenêtre
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        // On définit un utilisateur "employee" dans le localStorage
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
          })
        );
        // On crée un élément div pour y intégrer notre composant React
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.appendChild(root);
        // On lance notre routeur
        router();
      });
      // On teste que lorsqu'une erreur 404 survient, un message d'erreur est affiché
      test("Should fail and return an 404 error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"));
            },
          };
        });
        // On se rend sur la page des notes de frais
        window.onNavigate(ROUTES_PATH.Bills);
        // On attend que l'erreur soit affichée
        await new Promise(process.nextTick);
        // On récupère le message d'erreur
        const message = await screen.getByText(/Erreur 404/);
        // On vérifie que le message d'erreur est bien affiché
        expect(message).toBeTruthy();
      });
      // On teste que lorsqu'une erreur 500 survient, un message d'erreur est affiché
      test("Should fail and return an 500 error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"));
            },
          };
        });

        // On se rend sur la page des notes de frais
        window.onNavigate(ROUTES_PATH.Bills);
        // On attend que l'erreur soit affichée
        await new Promise(process.nextTick);
        // On récupère le message d'erreur
        const message = await screen.getByText(/Erreur 500/);
        // On vérifie que le message d'erreur est bien affiché
        expect(message).toBeTruthy();
      });
    });
  });
});
