import { convertFileSrc } from "@tauri-apps/api/core";
import { useState, createContext, useContext, useRef, useEffect } from "react";
import { useUserData } from "./user-data";
import { appLocalDataDir } from "@tauri-apps/api/path";

type LoadAudio = (src: string) => void;
type SetPlaying = (next: boolean) => Promise<void>;
type GetCurrentTime = () => number;
const PlaybackContext = createContext<[boolean, LoadAudio, SetPlaying, GetCurrentTime] | null>(null);

export function usePlayback() {
    return useContext(PlaybackContext)!;
}

type Props = Readonly<{
    children: React.ReactNode;
}>
export default function PlaybackProvider({ children }: Props) {
    const userData = useUserData();
    const [playing, setPlayingInner] = useState(false);
    
    const audio = useRef(new Audio()).current;
    
    useEffect(() => {
        audio.preload = "auto";
    }, [userData]);
    
    function loadAudio(src: string) {
        audio.src = convertFileSrc(src);
        audio.load();
        setPlayingInner(false);
    }
    
    async function setPlaying(playing: boolean) {
        setPlayingInner(playing);
        
        if (playing) {
            await audio.play();
        }
        else {
            audio.pause();
        }
    }
    
    function getCurrentTime() {
        return audio.currentTime * 1000;
    }
    
    return (
        <PlaybackContext.Provider value={[playing, loadAudio, setPlaying, getCurrentTime]}>
            { children }
        </PlaybackContext.Provider>
    );
}