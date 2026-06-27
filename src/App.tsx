import { Sidebar } from "./components/Sidebar";
import { HomePage } from "./pages/Home";
import { AddonsPage } from "./pages/Addons";
import { useStore } from "./state/store";
import { api } from "./lib/invoke";

function App() {
  const { activePage } = useStore();

  const testSearch = async () => {
    const results = await api.spSearch("Breaking Bad");
    console.log("search:", results);

    if (results[0]) {
      const meta = await api.spGetMeta(results[0].id, results[0].mediaType);
      console.log("meta:", meta);

      if (meta.item.imdbId) {
        const streams = await api.spGetStreams(
          meta.item.imdbId,
          meta.item.id,
          meta.item.mediaType,
          1,
          1,
        );
        console.log("streams:", streams);
      }
    }
  };
  return (
    <div className="flex h-screen w-screen bg-neutral-950 overflow-hidden text-white">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        {/* temp debug button */}
        <button
          onClick={testSearch}
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
