import { convertFileSrc } from "@tauri-apps/api/core";
import { useState, createContext, useContext, useRef, useEffect, useCallback } from "react";
import { Howl } from 'howler';
import { EventEmitter } from "events";

type PosUpdateListener = (pos: number) => any
type PosUpdateUnlisten = () => void

type Playback = {
    playing: boolean,
    playNewAudio: (src: string, loop?: boolean) => void,
    setPlaying: (next: boolean) => Promise<void>,
    togglePlaying: () => Promise<void>,
    getPosition: () => number,
    duration: number,
    seek: (ms: number) => void,
    clearAudio: () => void,
    addPosUpdateListener: (listener: PosUpdateListener) => PosUpdateUnlisten
}
const PlaybackContext = createContext<Playback | null>(null);

export function usePlayback() {
    return useContext(PlaybackContext)!;
}


type Props = Readonly<{
    children: React.ReactNode;
}>
export default function PlaybackProvider({ children }: Props) {
    const [howl, setHowlInner] = useState<Howl | null>(null);
    const [playing, setPlayingInner] = useState(false);
    const [duration, setDuration] = useState(0);
    
    const posEmitter = useRef(new EventEmitter()).current;
    const intervalIdRef = useRef<number | null>(null);
    
    function setHowl(next: Howl | null, play?: boolean) {
        setHowlInner(prev => {
            prev?.off();
            prev?.pause();
            if (intervalIdRef.current) clearInterval(intervalIdRef.current);
            console.log("paused prev, howl is now", next);
            
            if (next) {
                next.on("end", () => {
                    if (!next.loop())
                        setPlayingInner(false);
                });
                next.once("load", () => {
                    console.log("set duration");
                    setDuration(next.duration() * 1000)
                });
                
                intervalIdRef.current = setInterval(() => {
                    if (next.playing())
                        posEmitter.emit("pos-update", next.seek() * 1000);
                }, 0);
                
                if (play) next.play();
            }
            
            setPlayingInner(play ?? false);
            return next;
        });
    }
    
    function playNewAudio(src: string, loop?: boolean) {
        clearAudio();
        setHowl(new Howl({src: convertFileSrc(src), loop}), true);
    }
    
    async function setPlaying(playing: boolean) {
        if (!howl) return;
        
        setPlayingInner(playing);
        
        if (playing)    howl.play()
        else            howl.pause()
    }
    async function togglePlaying() {
        setPlaying(!playing);
    }
    
    function getPosition() {
        return howl? howl.seek() * 1000 : 0;
    }
    
    function seek(ms: number) {
        howl?.seek(ms / 1000);
    }
    
    function clearAudio() {
        setHowl(null);
    }
    
    function addPosUpdateListener(listener: PosUpdateListener) {
        posEmitter.addListener("pos-update", listener);
        return () => posEmitter.removeListener("pos-update", listener);
    }
    
    return (
        <PlaybackContext.Provider value={{playing, playNewAudio, setPlaying, togglePlaying, getPosition, seek, duration, clearAudio, addPosUpdateListener}}>
            { children }
        </PlaybackContext.Provider>
    );
}