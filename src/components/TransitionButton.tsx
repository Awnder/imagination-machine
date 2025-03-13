import React from "react";
import { ButtonProps } from "../interfaces";

export default function TransitionButton({ children, onClick, className, ...props }: ButtonProps) {
  const handleTransition = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    await onClick(e);
  }

  return (
    <button
      className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200 ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}
