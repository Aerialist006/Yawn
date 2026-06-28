import {
  House,
  FilmSlate,
  Television,
  PuzzlePiece,
  Gear,
  X,
} from "@phosphor-icons/react";
import type { View } from "../../App";

interface Props {
  view: View;
  onNavigate: (v: View) => void;
  open: boolean;
  onClose: () => void;
}

const NAV: { id: View; label: string; icon: React.ReactNode }[] = [
  { id: "home", label: "Home", icon: <House size={22} weight="fill" /> },
  {
    id: "movies",
    label: "Movies & TV",
    icon: <FilmSlate size={22} weight="fill" />,
  },
  { id: "anime", label: "Anime", icon: <Television size={22} weight="fill" /> },
  {
    id: "plugins",
    label: "Plugins",
    icon: <PuzzlePiece size={22} weight="fill" />,
  },
  { id: "settings", label: "Settings", icon: <Gear size={22} weight="fill" /> },
];

export function Sidebar({ view, onNavigate, open, onClose }: Props) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/70 z-20 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`
        fixed top-0 left-0 h-full w-60 bg-neutral-900 border-r border-white/5
        flex flex-col z-30 transition-transform duration-200
        ${open ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:static lg:z-auto
      `}
      >
        <div className="px-6 py-6 flex items-center justify-between border-b border-white/5">
          <span className="text-red-500 text-2xl font-black tracking-tighter">
            YAWN
          </span>
          <button
            className="lg:hidden text-neutral-500 hover:text-white"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex flex-col gap-1 p-3 flex-1">
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                onClose();
              }}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold
                transition-all duration-150 text-left w-full
                ${
                  view === item.id
                    ? "bg-red-600 text-white shadow-lg shadow-red-900/30"
                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                }
              `}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-white/5">
          <p className="text-[11px] text-neutral-700">Yawn v0.1.0</p>
        </div>
      </aside>
    </>
  );
}
