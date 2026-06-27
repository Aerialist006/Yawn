import { List } from "@phosphor-icons/react";

interface Props {
  onMenuOpen: () => void;
}

export function MobileHeader({ onMenuOpen }: Props) {
  return (
    <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-neutral-950/90 backdrop-blur shrink-0">
      <button
        onClick={onMenuOpen}
        className="text-neutral-400 hover:text-white"
      >
        <List size={24} />
      </button>
      <span className="text-red-500 text-xl font-black tracking-tighter">
        YAWN
      </span>
    </header>
  );
}
