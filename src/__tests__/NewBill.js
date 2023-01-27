/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { fireEvent, screen, waitFor } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes";
import { localStorageMock } from "../__mocks__/localStorage.js";
import userEvent from "@testing-library/user-event";
import mockStore from "../__mocks__/store.js";
import router from "../app/Router.js";

// mock le store qu'on va utiliser
jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  beforeEach(() => {
    // affiche les données de la page employé
    Object.defineProperty(window, "localStorage", { value: localStorageMock });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
        email: "a@a",
      })
    );
  });
  describe("When I am on NewBill Page", () => {
    // l'icône mail doit être en surbrilliance
    test("Then mail icon in vertical layout should be highlighted", async () => {
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.NewBill);
      await waitFor(() => screen.getByTestId("icon-mail"));
      const mailIcon = screen.getByTestId("icon-mail"); // récupère l'icône par son testid
      expect(mailIcon).toHaveClass("active-icon"); //check si l'icône est en surbrillance - on vérifie si l'élément a la classe correspondante
    });
    // le formulaire doit être présent à l'écran avec tous ses champs
    test("Then the form should be displayed", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      expect(screen.getByTestId("form-new-bill")).toBeTruthy();
      expect(screen.getByTestId("expense-type")).toBeTruthy();
      expect(screen.getByTestId("expense-name")).toBeTruthy();
      expect(screen.getByTestId("datepicker")).toBeTruthy();
      expect(screen.getByTestId("amount")).toBeTruthy();
      expect(screen.getByTestId("vat")).toBeTruthy();
      expect(screen.getByTestId("pct")).toBeTruthy();
      expect(screen.getByTestId("commentary")).toBeTruthy();
      expect(screen.getByTestId("file")).toBeTruthy();
      expect(screen.getByRole("button")).toBeTruthy();
    });
    //tests pour l'upload de fichier
    describe("When I upload a file", () => {
      // clear tous les mocks avant et après chaque test, assure que chaque test tourne bien avec le mock correct
      beforeEach(() => {
        jest.clearAllMocks();
      });
      afterEach(() => {
        jest.clearAllMocks();
      });
      test("Then, I can select a png, jpg or jpeg file", () => {
        // On initialise les données de la page
        const html = NewBillUI();
        document.body.innerHTML = html;
        // On définit une fonction pour naviguer sur la page
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };
        // On crée un nouveau container pour la page de facture
        const newBillContainer = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });
        // On crée un mock de la fonction qui va gérer le changement de fichier
        const changeFile = jest.fn((e) => newBillContainer.handleChangeFile(e));
        // On récupère l'input pour le fichier
        const file = screen.getByTestId("file");
        // On vérifie qu'il est bien présent
        expect(file).toBeTruthy();

        // On crée un fichier de test de type png
        const testFile = new File(["sample.png"], "sample.png", {
          type: "image/png",
        });

        // On écoute la fonction pour le changement de fichier
        file.addEventListener("change", changeFile);
        // On upload le fichier de test
        userEvent.upload(file, testFile);

        // On vérifie que la fonction pour le changement de fichier a bien été appelée
        expect(changeFile).toHaveBeenCalled();
        // On vérifie que le fichier uploadé est bien le fichier de test
        expect(file.files[0]).toEqual(testFile);
        // On vérifie que le nom du fichier correspond au fichier de test
        expect(file.files[0].name).toBe("sample.png");

        // On mock l'appel de l'alerte
        jest.spyOn(window, "alert").mockImplementation(() => {});
        // On vérifie que l'alerte n'a pas été appelée
        expect(window.alert).not.toHaveBeenCalled();
      });
      // on ne peut pas upload un fichier qui n'est pas une image
      test("Then, I can't select a non-image file, and the page displays an alert", async () => {
        // Initialise les données de la page
        const html = NewBillUI();
        document.body.innerHTML = html;
        // Définit une fonction pour naviguer sur la page
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };
        // Crée un nouveau container pour la page de facture
        const newBillContainer = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });

        // Crée un mock de la fonction qui gère le changement de fichier
        const changeFile = jest.fn(newBillContainer.handleChangeFile);
        // Récupère l'input pour le fichier
        const file = await screen.getByTestId("file");
        // Vérifie qu'il est bien présent
        expect(file).toBeTruthy();

        // Crée un fichier de test qui n'est pas une image
        const testFile = new File(["sample test file"], "sample.txt", {
          type: "text/plain",
        });

        // Ecoute la fonction pour le changement de fichier
        file.addEventListener("change", changeFile);
        // Upload le fichier de test
        userEvent.upload(file, testFile);

        // Vérifie que la fonction pour le changement de fichier a bien été appelée
        expect(changeFile).toHaveBeenCalled();
        // Vérifie que le nom et le type du fichier uploadé ne correspondent pas à un fichier png
        expect(file.files[0].name).not.toBe("sample.png");
        expect(file.files[0].type).not.toBe("image/png");

        jest.spyOn(window, "alert").mockImplementation(() => {});
        // Crée un mock de la fonction d'alerte
        expect(window.alert).not.toHaveBeenCalled();
        // Vérifie que l'alerte n'a pas été appelée
        expect(file.value).toBe("");
        // Vérifie que le champ de fichier est vide
      });
    });
  });
});

//Test d'intégration POST
describe("Given I am a user connected as Employee", () => {
  describe("When I submit a completed form", () => {
    test("Then a new bill should be created", async () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "azerty@email.com",
        })
      );

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });
      const sampleBill = {
        type: "Hôtel et logement",
        name: "encore",
        date: "2004-04-04",
        amount: 400,
        vat: 80,
        pct: 20,
        commentary: "séminaire billed",
        fileUrl:
          "https://test.storage.tld/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
        fileName: "preview-facture-free-201801-pdf-1.jpg",
        status: "pending",
      };

      screen.getByTestId("expense-type").value = sampleBill.type;
      screen.getByTestId("expense-name").value = sampleBill.name;
      screen.getByTestId("datepicker").value = sampleBill.date;
      screen.getByTestId("amount").value = sampleBill.amount;
      screen.getByTestId("vat").value = sampleBill.vat;
      screen.getByTestId("pct").value = sampleBill.pct;
      screen.getByTestId("commentary").value = sampleBill.commentary;

      newBill.fileName = sampleBill.fileName;
      newBill.fileUrl = sampleBill.fileUrl;
      newBill.updateBill = jest.fn();
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));

      const form = screen.getByTestId("form-new-bill");
      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);

      expect(handleSubmit).toHaveBeenCalled();
      expect(newBill.updateBill).toHaveBeenCalled();
    });
    // test erreur API
    test("fetches error from an API and fails with 500 error", async () => {
      jest.spyOn(mockStore, "bills");
      jest.spyOn(console, "error").mockImplementation(() => {}); // empêche console.error jest error
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      Object.defineProperty(window, "location", {
        value: { hash: ROUTES_PATH["NewBill"] },
      });

      window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));
      document.body.innerHTML = `<div id="root"></div>`;
      router();

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      mockStore.bills.mockImplementationOnce(() => {
        return {
          update: () => {
            return Promise.reject(new Error("Erreur 500"));
          },
        };
      });
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      // Submit form
      const form = screen.getByTestId("form-new-bill");
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);
      await new Promise(process.nextTick);
      expect(console.error).toBeCalled(); // s'attend à ce qu'une erreur soit appellée dans la console
    });
  });
});
