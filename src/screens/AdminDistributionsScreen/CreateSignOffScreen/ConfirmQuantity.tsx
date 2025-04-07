import { Fragment } from "react";
import ConfirmQuantityItems from "./ConfirmQuantityItems";

export default function ConfirmQuantity() {
  return (
    <Fragment>
      <h1 className="text-2xl font-semibold">Confirm Quantity</h1>
      <p>
        Ensure that the quantity that needs to be allocated for each select item
        is correct. It is prefilled with the original allocated quantity, but if
        changes need to be made, ensure you make those changes. Be careful not
        to exceed the quantity available.
      </p>
      <ConfirmQuantityItems />
    </Fragment>
  );
}
