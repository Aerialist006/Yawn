import { invoke } from "@tauri-apps/api/core";
import { useEffect } from "react";

function App() {
  useEffect(() => {
    async function test() {
      const pong = await invoke("ping");
      console.log("ping:", pong);

      const addon = await invoke("install_addon", {
        transportUrl: "https://v3-cinemeta.strem.io/manifest.json",
      });
      console.log("addon:", addon);
    }

    test();
  }, []);

  return (
    <div className="flex items-center justify-center h-screen bg-neutral-950">
      <p className="text-white text-2xl">Yawn</p>
    </div>
  );
}

export default App;
