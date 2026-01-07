"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

import { Button } from "./ui/button";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  pendingText?: string;
  children: ReactNode;
};

const FormSubmitButton = ({
  pendingText = "Submitting...",
  children,
  ...buttonProps
}: Props) => {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} {...buttonProps}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {pending ? pendingText : children}
    </Button>
  );
};

export default FormSubmitButton;
