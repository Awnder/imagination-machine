import React from "react";

export interface ButtonProps {
  children: React.ReactNode;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  props?: any;
}

export default function TransitionButton({ children, onClick, ...props }: ButtonProps) {
  const handleTransition = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    await onClick(e);
  }

  return (
    <button
      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}
