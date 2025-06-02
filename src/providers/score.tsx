import { useState, createContext, useContext, useRef } from "react";

/** e.g. hit the note within `+25` or `-25` ms for a `perfect`   */
export const ACCURACY_THRESHOLDS = [25, 100];
export const MISS_THRESHOLD = ACCURACY_THRESHOLDS[ACCURACY_THRESHOLDS.length-1];

export type Stats = {
    perfect: number,
    good: number,
    miss: number,
    avgDelta: number,
    maxCombo: number,
    combo: number,
}
const StatsContext = createContext<Stats | null>(null);

type Delta = number | "miss";

export function getPraise(delta: Delta) {
    if (delta == "miss") return "miss";
    delta = Math.abs(delta);
    if (delta > MISS_THRESHOLD) return "miss";
    if (delta > ACCURACY_THRESHOLDS[0]) return "good";
    return "perfect";
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
        console.log(delta);
        
        if (delta == "miss" || delta > MISS_THRESHOLD) {
            setStats(prev => ({...prev, miss: prev.miss + 1, combo: 0}));
        }
        else {
            if (Math.abs(delta) <= ACCURACY_THRESHOLDS[0]) {
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