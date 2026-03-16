const MAX_TUTORIAL_TARGET_ATTEMPTS = 12;
const REQUEST_EXAMPLE_SELECTOR = '[data-tutorial="request-example"]';

const setNativeValue = (
  element: HTMLInputElement | HTMLSelectElement,
  value: string
) => {
  const prototype =
    element instanceof HTMLInputElement
      ? window.HTMLInputElement.prototype
      : window.HTMLSelectElement.prototype;
  const valueSetter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;

  valueSetter?.call(element, value);
};

export const autoFillRequestExample = (
  containerSelector = REQUEST_EXAMPLE_SELECTOR,
  attempt = 0
) => {
  const requestExample = document.querySelector(containerSelector);

  if (!requestExample) {
    if (attempt < MAX_TUTORIAL_TARGET_ATTEMPTS) {
      requestAnimationFrame(() =>
        autoFillRequestExample(containerSelector, attempt + 1)
      );
    }
    return;
  }

  const quantityInput = requestExample.querySelector(
    'input[type="number"]'
  ) as HTMLInputElement | null;
  const prioritySelect = requestExample.querySelector(
    "select"
  ) as HTMLSelectElement | null;

  if (quantityInput) {
    setNativeValue(quantityInput, "12");
    quantityInput.dispatchEvent(new Event("input", { bubbles: true }));
    quantityInput.dispatchEvent(new Event("change", { bubbles: true }));
  }

  if (prioritySelect) {
    setNativeValue(prioritySelect, "HIGH");
    prioritySelect.dispatchEvent(new Event("change", { bubbles: true }));
  }
};
