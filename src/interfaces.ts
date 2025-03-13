export interface WordDescriptionProps {
  word: string;
  description: string;
}

export interface WordDisplayProps {
  word: string;
  description: string;
  index: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>, index: number) => void;
  onRemove: (index: number) => void;
}

export interface ButtonProps {
  children: React.ReactNode;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  className?: string;
  props?: any;
}
