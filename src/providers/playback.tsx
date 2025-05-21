import { convertFileSrc } from "@tauri-apps/api/core";
import { useState, createContext, useContext, useRef, useEffect } from "react";

type Playback = {
    playing: boolean,
    loadAudio: (src: string) => void,
    setPlaying: (next: boolean) => Promise<void>,
    getPosition: () => number,
    duration: number,
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
    const [playing, setPlayingInner] = useState(false);
    const [duration, setDuration] = useState(0);
    
    const audioRef = useRef(new Audio());
    
    useEffect(() => {
        const onEnded = () => setPlayingInner(false);
        audioRef.current.addEventListener("ended", onEnded);
        
        const onLoadedMetadata = () => setDuration(audioRef.current.duration * 1000);
        audioRef.current.addEventListener("loadedmetadata", onLoadedMetadata);
        
        return () => { 
            audioRef.current.removeEventListener("ended", onEnded); 
            audioRef.current.removeEventListener("loadedmetadata", onLoadedMetadata); 
        }
    }, []);
    
    function loadAudio(src: string) {
        audioRef.current.src = convertFileSrc(src);
        audioRef.current.load();
        setPlayingInner(false);
    }
    
    async function setPlaying(playing: boolean) {
        setPlayingInner(playing);
        
        if (playing) {
            await audioRef.current.play();
        }
        else {
            audioRef.current.pause();
        }
    }
    
    function getPosition() {
        return audioRef.current.currentTime * 1000;
    }
    
    function seek(ms: number) {
        audioRef.current.currentTime = ms / 1000;
    }
    
    return (
        <PlaybackContext.Provider value={{playing, loadAudio, setPlaying, getPosition, seek, duration}}>
            { children }
        </PlaybackContext.Provider>
    );
}