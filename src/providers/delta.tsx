import { useState, createContext, useContext, useRef } from "react";

export const HIT_WINDOWS = [50, 200, 400];

export type Delta = number | "miss";

type BroadcastDelta = (delta: Delta) => void;

type DeltaListener = (delta: Delta) => any;
type RemoveDeltaListener = () => void;

type AddDeltaListener = (listener: DeltaListener) => RemoveDeltaListener;

const DeltaContext = createContext<[BroadcastDelta, AddDeltaListener] | null>(null);

export function useDelta() {
    return useContext(DeltaContext)!;
}

type Props = Readonly<{
    children: React.ReactNode;
}>
export default function DeltaProvider({ children }: Props) {
    
    const listeners = useRef<Set<DeltaListener>>(new Set()).current;
    
    function broadcastDelta(delta: Delta) {
        for (const listener of listeners) {
            listener(delta);
        }
    }
    
    function addDeltaListener(listener: DeltaListener) {
        listeners.add(listener);
        
        return () => listeners.delete(listener);
    }
    
    return (
        <DeltaContext.Provider value={[broadcastDelta, addDeltaListener]}>
            { children }
        </DeltaContext.Provider>
    );
}