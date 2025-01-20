import { FormEventHandler, startTransition } from "react";

/**
 * Creates a form submit handler that doesn't reset fields on submit.
 * See [this thread](https://github.com/facebook/react/issues/29034)
 *
 * @param formAction Function taking in a FormData object. Will be called on form submit
 * @returns A function to be passed to a form's onSubmit
 */
export default function submitHandler(
  // eslint-disable-next-line
  formAction: (formData: FormData) => any
): FormEventHandler<HTMLFormElement> {
  return (event) => {
    event.preventDefault();
    startTransition(() => formAction(new FormData(event.currentTarget)));
  };
}
