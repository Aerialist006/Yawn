import { Sidebar } from "./components/Sidebar";
import { HomePage } from "./pages/Home";
import { AddonsPage } from "./pages/Addons";
import { useStore } from "./state/store";
import { api } from "./lib/invoke";

function App() {
  const { activePage } = useStore();

  const testInstall = async () => {
    try {
      const result = await api.installAddon(
        "https://v3-cinemeta.strem.io/manifest.json",
      );
      console.log("SUCCESS:", result);
    } catch (e) {
      console.error("FAILED:", e);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-neutral-950 overflow-hidden text-white">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        {/* temp debug button */}
        <button
          onClick={testInstall}
          className="fixed top-2 right-2 z-50 bg-red-600 text-white text-xs px-3 py-1 rounded"
        >
          TEST INSTALL
        </button>
        {activePage === "home" && <HomePage />}
        {activePage === "addons" && <AddonsPage />}
      </main>
    </div>
  );
}

export default App;
