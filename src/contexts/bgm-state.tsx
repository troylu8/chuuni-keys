import { useState, createContext, useContext, useEffect } from "react";
import bgm from "../lib/sound";


export function useBgmPos() {
    const [pos, setPos] = useState(bgm.pos);

    useEffect(() => {
        const unlisten = bgm.addPosListener(setPos);
        return unlisten;
    }, []);

    return pos;
}


type BgmState = {
    paused: boolean
    duration: number
    speed: number
    volume: number
    title?: string
    credit_audio?: string
}
const BgmStateContext = createContext<BgmState | null>(null);

export function useBgmState() {
    return useContext(BgmStateContext)!;
}

type Props = Readonly<{
    children: React.ReactNode;
}>
export default function BgmStateProvider({ children }: Props) {
    const [bgmState, setBgmState] = useState<BgmState>({
        paused:     bgm.paused,
        duration:   bgm.duration,
        speed:      bgm.speed,
        volume:     bgm.volume,
    });
    
    useEffect(() => {
        bgm.onLoad = info => setBgmState(prev => ({...prev, title: info?.title, credit_audio: info?.credit_audio}));
        bgm.onPlayOrPause = paused => setBgmState(prev => ({...prev, paused}));
        bgm.onDurationChange = duration => setBgmState(prev => ({...prev, duration}));
        bgm.onSpeedChange = speed => setBgmState(prev => ({...prev, speed}));
        bgm.onVolumeChange = volume => setBgmState(prev => ({...prev, volume}));
        
        return () => {
            delete bgm.onLoad;
            delete bgm.onPlayOrPause;
            delete bgm.onDurationChange;
            delete bgm.onSpeedChange;
            delete bgm.onVolumeChange;
        }
    }, []);
    
    return (
        <BgmStateContext.Provider value={bgmState}>
            { children }
        </BgmStateContext.Provider>
    );
}