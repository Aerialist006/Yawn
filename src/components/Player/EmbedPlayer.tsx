import { useRef, useState } from "react";
import { PlayerControls } from "./PlayerControls";

interface Props {
  url: string;
  streams: { name: string; url: string; streamType: string }[];
  currentStreamIndex: number;
  onStreamChange: (i: number) => void;
  title: string;
  episodeLabel?: string;
  onBack: () => void;
}

export function EmbedPlayer({
  url,
  streams,
  currentStreamIndex,
  onStreamChange,
  title,
  episodeLabel,
  onBack,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  return (
    <div className="relative w-full h-full bg-black">
      <iframe
        ref={iframeRef}
        key={url}
        src={url}
        className="w-full h-full border-none"
        allowFullScreen
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
      />
      {/* Overlay — only top bar, provider handles actual controls */}
      <PlayerControls
        videoRef={{ current: null } as any}
        title={title}
        episodeLabel={episodeLabel}
        streams={streams}
        currentStreamIndex={currentStreamIndex}
        onStreamChange={onStreamChange}
        onBack={onBack}
        subtitleTracks={[]}
        currentSubIndex={-1}
        onSubChange={() => {}}
        onImportSub={() => {}}
        isEmbed={true}
      />
    </div>
  );
}
