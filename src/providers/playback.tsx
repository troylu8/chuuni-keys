import { convertFileSrc } from "@tauri-apps/api/core";
import { useState, createContext, useContext, useRef } from "react";

type LoadAudio = (src: string) => void;
type SetPlaying = (next: boolean) => Promise<void>;
const PlaybackContext = createContext<[boolean, LoadAudio, SetPlaying] | null>(null);

export function usePlayback() {
    return useContext(PlaybackContext)!;
}

type Props = Readonly<{
    children: React.ReactNode;
}>
export default function PlaybackProvider({ children }: Props) {
    const [playing, setPlayingInner] = useState(false);
    
    const audio = useRef(new Audio()).current;
    
    function loadAudio(src: string) {
        audio.src = convertFileSrc(src);
        audio.load();
        setPlayingInner(false);
    }
    
    async function setPlaying(playing: boolean) {
        if (playing) {
            await audio.play();
        }
        else {
            audio.pause();
        }
        setPlayingInner(playing);
    }
    
    return (
        <PlaybackContext.Provider value={[playing, loadAudio, setPlaying]}>
            { children }
        </PlaybackContext.Provider>
    );
}