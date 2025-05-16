import { useState, createContext, useContext, useRef } from "react";

/** e.g. hit the note within `+25` or `-25` ms for a `perfect`   */
export const ACCURACY_THRESHOLDS = [25, 100];
export const MISS_THRESHOLD = ACCURACY_THRESHOLDS[ACCURACY_THRESHOLDS.length-1];

type Stats = {
    perfect: number,
    good: number,
    miss: number,
    avgDelta: number,
    maxCombo: number,
    combo: number
}
const SummaryContext = createContext<(() => Stats) | null>(null);


export type Delta = number | "miss";
type BroadcastDelta = (delta: Delta) => void;
type DeltaListener = (delta: Delta) => any;
type RemoveDeltaListener = () => void;
type AddDeltaListener = (listener: DeltaListener) => RemoveDeltaListener;
const DeltaContext = createContext<[BroadcastDelta, AddDeltaListener] | null>(null);

export function useSummary() {
    return useContext(SummaryContext)!;
}

export function useDelta() {
    return useContext(DeltaContext)!;
}

type Props = Readonly<{
    children: React.ReactNode;
}>
export default function DeltaProvider({ children }: Props) {
    const statsRef = useRef({
        perfect: 0,
        good: 0,
        miss: 0,
        avgDelta: 0,
        maxCombo: 0,
        
        combo: 0
    });
    const stats = statsRef.current;
    
    const listeners = useRef<Set<DeltaListener>>(new Set()).current;
    
    function broadcastDelta(delta: Delta) {
        if (delta == "miss") {
            stats.miss++;
            stats.combo = 0;
        }
        else {
            if (Math.abs(delta) <= ACCURACY_THRESHOLDS[0]) {
                stats.perfect++;
            }
            else {
                stats.good++;
            }
            stats.combo++;
            stats.maxCombo = Math.max(stats.maxCombo, stats.combo);
        }
        
        for (const listener of listeners) {
            listener(delta);
        }
    }
    
    function addDeltaListener(listener: DeltaListener) {
        listeners.add(listener);
        
        return () => listeners.delete(listener);
    }
    
    function getStats() {
        return stats;
    }
    
    return (
        <SummaryContext.Provider value={getStats}>
            <DeltaContext.Provider value={[broadcastDelta, addDeltaListener]}>
                { children }
            </DeltaContext.Provider>
        </SummaryContext.Provider>
    );
}