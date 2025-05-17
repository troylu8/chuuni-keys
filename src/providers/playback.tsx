import { convertFileSrc } from "@tauri-apps/api/core";
import { useState, createContext, useContext, useRef, useEffect } from "react";
import { useUserData } from "./user-data";

const OFFSET = 55;

type LoadAudio = (src: string) => void;
type SetPlaying = (next: boolean) => Promise<void>;
type GetCurrentTime = () => number;
type SeekAudio = (ms: number) => void;
const PlaybackContext = createContext<[boolean, LoadAudio, SetPlaying, GetCurrentTime, SeekAudio] | null>(null);

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
    
    function getCurrentTime() {
        return audio.currentTime * 1000 + OFFSET;
    }
    
    function seekAudio(ms: number) {
        audio.currentTime = ms / 1000;
    }
    
    return (
        <PlaybackContext.Provider value={[playing, loadAudio, setPlaying, getCurrentTime, seekAudio]}>
            { children }
        </PlaybackContext.Provider>
    );
}