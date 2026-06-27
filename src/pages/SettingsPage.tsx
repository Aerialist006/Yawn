import { Gear } from "@phosphor-icons/react";

export function SettingsPage() {
  return (
    <div className="px-8 py-10 max-w-2xl">
      <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
        <Gear size={28} weight="fill" className="text-red-500" />
        Settings
      </h1>
      <p className="text-neutral-500">Coming soon.</p>
    </div>
  );
}
