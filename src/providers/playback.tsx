import { convertFileSrc } from "@tauri-apps/api/core";
import { useState, createContext, useContext, useRef, useEffect } from "react";
import { useUserData } from "./user-data";

const OFFSET = 55;

type Playback = {
    playing: boolean,
    loadAudio: (src: string) => void,
    setPlaying: (next: boolean) => Promise<void>,
    getPosition: () => number,
    getDuration: () => number,
    seek: (ms: number) => void
}
const PlaybackContext = createContext<Playback | null>(null);

export function usePlayback() {
    return useContext(PlaybackContext)!;
}

type Props = Readonly<{
    children: React.ReactNode;
}>
export default function PlaybackProvider({ children }: Props) {
    const userdata = useUserData();
    const [playing, setPlayingInner] = useState(false);
    
    const audio = useRef(new Audio()).current;
    
    useEffect(() => {
        audio.preload = "auto";
        
        const onEnded = () => setPlayingInner(false);
        audio.addEventListener("ended", onEnded);
        return () => { audio.removeEventListener("ended", onEnded); }
    }, [userdata]);
    
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
    
    function getPosition() {
        return audio.currentTime * 1000 + OFFSET;
    }
    
    function seek(ms: number) {
        audio.currentTime = ms / 1000;
    }
    
    function getDuration() {
        return audio.duration * 1000;
    }
    
    return (
        <PlaybackContext.Provider value={{playing, loadAudio, setPlaying, getPosition, seek, getDuration}}>
            { children }
        </PlaybackContext.Provider>
    );
}