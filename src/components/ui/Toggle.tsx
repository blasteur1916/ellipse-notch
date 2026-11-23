import { motion } from "framer-motion";

interface Props {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}

export function Toggle({ checked, label, onChange }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`flex h-[22px] w-[38px] shrink-0 items-center rounded-full p-[3px] transition-colors duration-200 ${
        checked ? "justify-end bg-paper" : "justify-start bg-line"
      }`}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 600, damping: 36 }}
        className={`size-4 rounded-full ${checked ? "bg-ink" : "bg-paper"}`}
      />
    </button>
  );
}
