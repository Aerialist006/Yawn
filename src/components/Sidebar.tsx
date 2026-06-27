import { useStore } from "../state/store";

export function Sidebar() {
  const { activePage, setActivePage } = useStore();

  const items = [
    { id: "home" as const, label: "Home", icon: "⊞" },
    { id: "addons" as const, label: "Add-ons", icon: "⊕" },
  ];

  return (
    <aside className="w-16 flex flex-col items-center py-6 gap-2 bg-neutral-900 border-r border-neutral-800 shrink-0">
      <div className="mb-6">
        <span className="text-white font-bold text-lg">Y</span>
      </div>
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => setActivePage(item.id)}
          title={item.label}
          className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-colors
            ${activePage === item.id
              ? "bg-white text-black"
              : "text-neutral-500 hover:text-white hover:bg-neutral-800"
            }`}
        >
          {item.icon}
        </button>
      ))}
    </aside>
  );
}