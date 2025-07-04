import { convertFileSrc } from "@tauri-apps/api/core";
import { useState, createContext, useContext, useRef, useEffect } from "react";
import { EventEmitter } from "events";
import { useSettings } from "./settings";

type PosUpdateListener = (offsetPos: number, truePos: number) => any
type PosUpdateUnlisten = () => void

type Playback = {
    playing: boolean,
    loadAudio: (src: string, options?: { startPlaying?: boolean, restart?: boolean }) => Promise<boolean>,
    setPlaying: (next: boolean) => Promise<void>,
    getTruePosition: () => number,
    getOffsetPosition: () => number,
    duration: number,
    seek: (ms: number) => void,
    addPosUpdateListener: (listener: PosUpdateListener) => PosUpdateUnlisten,
    speed: number,
    setAudioSpeed: (speed: number) => void,
}
const PlaybackContext = createContext<Playback | null>(null);

export function usePlayback() {
    return useContext(PlaybackContext)!;
}


type Props = Readonly<{
    children: React.ReactNode;
}>
export default function PlaybackProvider({ children }: Props) {
    const [{ offset }] = useSettings();
    
    const audio = useRef<HTMLAudioElement>(new Audio()).current;
    const [playing, setPlayingInner] = useState(false);
    const [duration, setDuration] = useState(0);
    const [speed, setSpeed] = useState(1);
    
    const posEmitter = useRef(new EventEmitter()).current;
    useEffect(() => {posEmitter.setMaxListeners(100)}, []);
    
    useEffect(() => {
        
        // update duration state when audio metadata loaded
        const updateDuration = () => setDuration(audio.duration * 1000);
        audio.addEventListener("loadedmetadata", updateDuration);
        
        // emit pos-update while audio is playing
        const posUpdateInterval = setInterval(() => {
            if (!audio.paused)
                posEmitter.emit("pos-update", getOffsetPosition(), getTruePosition());
        }, 0);
        
        return () => {
            audio.removeEventListener("loadedmetadata", updateDuration);
            clearInterval(posUpdateInterval);
        }
    }, [offset]);
    
    async function loadAudio(src: string, options?: { startPlaying?: boolean, restart?: boolean }) {
        const newSrc = convertFileSrc(src);
        if (options?.restart === false && audio.src == newSrc) 
            return false;
        
        audio.src = newSrc;
        audio.load();
        setDuration(audio.duration);
        setAudioSpeed(1);
        await setPlaying(options?.startPlaying ?? false);
        return true;
    }
    
    async function setPlaying(next: boolean) {
        if (!audio.src || !audio.paused == next) return;
        
        setPlayingInner(next);
        
        if (next) {
            await audio.play().catch(e => {
                if (e.name != "AbortError") throw e; // ignore AbortErrors
            });
        }
        else audio.pause();
    }
    
    function getTruePosition() {
        return audio? audio.currentTime * 1000 : 0;
    }
    
    function getOffsetPosition() {
        return getTruePosition() + offset;
    }
    
    function seek(ms: number) {
        audio.currentTime = ms / 1000;
    }
    
    function addPosUpdateListener(listener: PosUpdateListener) {
        posEmitter.addListener("pos-update", listener);
        return () => posEmitter.removeListener("pos-update", listener);
    }
    
    function setAudioSpeed(speed: number) {
        setSpeed(speed);
        audio.playbackRate = speed;
    }
    
    return (
        <PlaybackContext.Provider value={{ playing, loadAudio, setPlaying, getTruePosition, getOffsetPosition, seek, duration, addPosUpdateListener, speed, setAudioSpeed }}>
            { children }
        </PlaybackContext.Provider>
    );
}