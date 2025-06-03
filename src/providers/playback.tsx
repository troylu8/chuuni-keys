import { convertFileSrc } from "@tauri-apps/api/core";
import { useState, createContext, useContext, useRef } from "react";
import { Howl } from 'howler';
import { EventEmitter } from "events";
import { useSettings } from "./settings";

type PosUpdateListener = (pos: number, offset_pos: number) => any
type PosUpdateUnlisten = () => void

type Playback = {
    playing: boolean,
    playNewAudio: (src: string, loop?: boolean) => void,
    setPlaying: (next: boolean) => void,
    togglePlaying: () => void,
    getTruePosition: () => number,
    getOffsetPosition: () => number,
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
    const [{ offset }] = useSettings();
    
    const [howl, setHowlInner] = useState<Howl | null>(null);
    const [playing, setPlayingInner] = useState(false);
    const [duration, setDuration] = useState(0);
    
    const posEmitter = useRef(new EventEmitter()).current;
    const intervalIdRef = useRef<number | null>(null);
    
    function setHowl(next: Howl | null, play?: boolean) {
        setHowlInner(prev => {
            console.log("starting sethowlinner");
            prev?.off();
            prev?.pause();
            if (intervalIdRef.current) clearInterval(intervalIdRef.current);
            
            if (next) {
                next.on("end", () => {
                    if (!next.loop())
                        setPlayingInner(false);
                });
                next.once("load", () => {
                    setDuration(next.duration() * 1000)
                });
                
                intervalIdRef.current = setInterval(() => {
                    if (next.playing()) {
                        const pos = next.seek() * 1000;
                        posEmitter.emit("pos-update", pos, pos + offset);
                    }
                }, 0);
                
                if (play) next.play();
            }
            
            setPlayingInner(play ?? false);
            return next;
        });
    }
    
    function playNewAudio(src: string, loop?: boolean) {
        clearAudio();
        console.log("setting new howl");
        setHowl(new Howl({src: convertFileSrc(src), loop}), true);
    }
    
    function setPlaying(next: boolean) {
        if (!howl || playing == next) return;
        
        console.log("setting to ", next);
        setPlayingInner(next);
        
        if (next)   howl.play();
        else        howl.pause();
    }
    function togglePlaying() {
        const next = !playing;
        setPlayingInner(prev => {
            if (!howl) return prev;
            if (howl.playing() == next) return next;
            
            if (next) {
                howl.play();
                return true;
            }
            
            howl.pause();
            return false;
        });
    }
    
    function getTruePosition() {
        return howl? howl.seek() * 1000 : 0;
    }
    
    function getOffsetPosition() {
        return getTruePosition() + offset;
    }
    
    function seek(ms: number) {
        howl?.seek(ms / 1000);
    }
    
    function clearAudio() {
        console.log("clearing audio");
        setHowl(null);
    }
    
    function addPosUpdateListener(listener: PosUpdateListener) {
        posEmitter.addListener("pos-update", listener);
        return () => posEmitter.removeListener("pos-update", listener);
    }
    
    return (
        <PlaybackContext.Provider value={{playing, playNewAudio, setPlaying, togglePlaying, getTruePosition, getOffsetPosition, seek, duration, clearAudio, addPosUpdateListener}}>
            { children }
        </PlaybackContext.Provider>
    );
}