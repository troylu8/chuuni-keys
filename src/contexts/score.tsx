import { useState, createContext, useContext, useRef } from "react";

export const PERFECT_THRESHOLD = 40;
export const GOOD_THRESHOLD = 100;

/** hits outside this threshold are ignored, they don't even count as a miss */
export const HIT_THRESHOLD = 250;

export type Stats = {
    perfect: number,
    good: number,
    miss: number,
    avgDelta: number,
    maxCombo: number,
    combo: number,
}
const StatsContext = createContext<Stats | null>(null);

export type Delta = number | "miss";

export type Praise = "miss" | "" | "perfect" | "good";
export const PRAISE_COLORS: Record<Praise, string> = {
    "": "var(--miss)",
    "miss": "var(--miss)",
    "good": "var(--good)",
    "perfect": "var(--perfect)",
}

export function getPraise(delta: Delta): Praise {
    if (delta == "miss") return "miss";
    delta = Math.abs(delta);
    if (delta < PERFECT_THRESHOLD) return "perfect";
    if (delta < GOOD_THRESHOLD) return "good";
    if (delta < HIT_THRESHOLD) return "miss";
    return "";
}

type BroadcastDelta = (delta: Delta) => void;
type DeltaListener = (delta: Delta) => any;
type RemoveDeltaListener = () => void;
type AddDeltaListener = (listener: DeltaListener) => RemoveDeltaListener;
const DeltaContext = createContext<[BroadcastDelta, AddDeltaListener] | null>(null);

export function useStats() {
    return useContext(StatsContext)!;
}

export function useDelta() {
    return useContext(DeltaContext)!;
}

type Props = Readonly<{
    children: React.ReactNode;
}>
export default function DeltaProvider({ children }: Props) {
    
    const [stats, setStats] = useState<Stats>({
        perfect: 0,
        good: 0,
        miss: 0,
        avgDelta: 0,
        maxCombo: 0,
        combo: 0
    });
    
    const listeners = useRef<Set<DeltaListener>>(new Set()).current;
    
    function broadcastDelta(delta: Delta) {
        
        // if delta is so big its not even considered a hit, ignore it
        if (delta != "miss" && delta > HIT_THRESHOLD) return;
        
        if (delta == "miss" || delta > GOOD_THRESHOLD) {
            setStats(prev => ({...prev, miss: prev.miss + 1, combo: 0}));
        }
        else {
            if (Math.abs(delta) < PERFECT_THRESHOLD) {
                setStats(prev => ({
                    ...prev, 
                    perfect: prev.perfect + 1,
                    combo: prev.combo + 1,
                    maxCombo: Math.max(prev.maxCombo, prev.combo + 1)
                }));
            }
            else {
                setStats(prev => ({
                    ...prev, 
                    good: prev.good + 1, 
                    combo: prev.combo + 1,
                    maxCombo: Math.max(prev.maxCombo, prev.combo + 1)
                }));
            }
        }
        
        for (const listener of listeners) 
            listener(delta);
    }
    
    function addDeltaListener(listener: DeltaListener) {
        listeners.add(listener);
        
        return () => listeners.delete(listener);
    }
    
    return (
        <StatsContext.Provider value={stats}>
            <DeltaContext.Provider value={[broadcastDelta, addDeltaListener]}>
                { children }
            </DeltaContext.Provider>
        </StatsContext.Provider>
    );
}