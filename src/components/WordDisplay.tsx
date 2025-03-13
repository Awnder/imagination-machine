import TransitionButton from "./TransitionButton";
import { WordDisplayProps } from "../interfaces";

export default function WordDisplay({
  word,
  description,
  index,
  onChange,
  onRemove,
}: WordDisplayProps) {
  return (
    <div className="flex flex-row items-center gap-2">
      <label htmlFor={`word${index}`}>{description}</label>
      <input
        type="text"
        id={`word${index}`}
        name={`word${index}`}
        value={word}
        onChange={(e) => onChange(e, index)}
        className="border rounded px-2 py-1"
      />
      <TransitionButton onClick={() => onRemove(index)}>
        Remove
      </TransitionButton>
    </div>
  );
}
