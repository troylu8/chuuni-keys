import { useState, createContext, useContext, useRef, useCallback, useEffect } from "react";

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


export type Delta = number | "miss";
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
        if (delta == "miss") {
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
        
        for (const listener of listeners) {
            listener(delta);
        }
    }
    
    function addDeltaListener(listener: DeltaListener) {
        listeners.add(listener);
        
        return () => listeners.delete(listener);
    }
    
    useEffect(() => console.log(stats), [stats]);
    
    
    return (
        <StatsContext.Provider value={stats}>
            <DeltaContext.Provider value={[broadcastDelta, addDeltaListener]}>
                { children }
            </DeltaContext.Provider>
        </StatsContext.Provider>
    );
}