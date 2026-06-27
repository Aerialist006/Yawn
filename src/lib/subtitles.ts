// Convert .srt to .vtt blob URL for use in <track>
export function srtToVtt(srt: string): string {
  const vtt =
    "WEBVTT\n\n" +
    srt
      .replace(/\r\n/g, "\n")
      .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2") // srt → vtt timestamp
      .trim();

  const blob = new Blob([vtt], { type: "text/vtt" });
  return URL.createObjectURL(blob);
}

export async function fetchAndConvertSub(url: string): Promise<string> {
  const res = await fetch(url);
  const text = await res.text();
  if (
    url.endsWith(".srt") ||
    text.startsWith("1\n") ||
    text.match(/^\d+\r?\n\d{2}:/m)
  ) {
    return srtToVtt(text);
  }
  // Already VTT
  const blob = new Blob([text], { type: "text/vtt" });
  return URL.createObjectURL(blob);
}

export function fileToVttUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (file.name.endsWith(".srt")) {
        resolve(srtToVtt(text));
      } else {
        const blob = new Blob([text], { type: "text/vtt" });
        resolve(URL.createObjectURL(blob));
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
