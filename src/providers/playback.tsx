import { convertFileSrc } from "@tauri-apps/api/core";
import { useState, createContext, useContext, useRef, useEffect } from "react";
import { useUserData } from "./user-data";

type LoadAudio = (src: string) => void;
type SetPlaying = (next: boolean) => Promise<void>;
type GetProgress = () => number;
const PlaybackContext = createContext<[boolean, LoadAudio, SetPlaying, GetProgress] | null>(null);

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
        // initialize audio with a random audio file bc it reduces start lag for some reason TODO replace with bg music?
        if (userData)
            audio.src = convertFileSrc(`${userData.base_dir}\\sfx\\hitsound.ogg`);
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
    
    function getProgress() {
        return audio.currentTime / audio.duration;
    }
    
    return (
        <PlaybackContext.Provider value={[playing, loadAudio, setPlaying, getProgress]}>
            { children }
        </PlaybackContext.Provider>
    );
}