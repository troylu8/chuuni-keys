import { convertFileSrc } from "@tauri-apps/api/core";
import { useState, createContext, useContext, useRef, useEffect } from "react";

type Playback = {
    playing: boolean,
    loadAudio: (src: string) => void,
    setPlaying: (next: boolean) => Promise<void>,
    togglePlaying: () => Promise<void>,
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
    
    const audioRef = useRef<HTMLAudioElement | null>(null);
    function audio() {
        if (!audioRef.current) audioRef.current = new Audio();
        return audioRef.current;
    }
    
    useEffect(() => {
        const onEnded = () => setPlayingInner(false);
        audio().addEventListener("ended", onEnded);
        
        const onLoadedMetadata = () => setDuration(audio().duration * 1000);
        audio().addEventListener("loadedmetadata", onLoadedMetadata);
        
        return () => { 
            audio().removeEventListener("ended", onEnded); 
            audio().removeEventListener("loadedmetadata", onLoadedMetadata); 
        }
    }, []);
    
    function loadAudio(src: string) {
        audio().src = convertFileSrc(src);
        audio().load();
        setPlayingInner(false);
    }
    
    async function setPlaying(playing: boolean) {
        setPlayingInner(playing);
        
        if (playing) {
            await audio().play();
        }
        else {
            audio().pause();
        }
    }
    function togglePlaying() {
        return new Promise<void>(resolve => {
            setPlayingInner(prev => {
                if (prev) {
                    audio().pause();
                    resolve();
                }
                else 
                    audio().play().then(resolve);
                
                return !prev;
            });
        });
    }
    
    function getPosition() {
        return audio().currentTime * 1000;
    }
    
    function seek(ms: number) {
        audio().currentTime = ms / 1000;
    }
    
    return (
        <PlaybackContext.Provider value={{playing, loadAudio, setPlaying, togglePlaying, getPosition, seek, duration}}>
            { children }
        </PlaybackContext.Provider>
    );
}