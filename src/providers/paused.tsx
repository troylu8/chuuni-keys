import { invoke } from "@tauri-apps/api/core";
import { useState, createContext, useContext } from "react";


const PausedContext = createContext<[boolean, (next: boolean) => any] | null>(null);

export function usePaused() {
    return useContext(PausedContext)!;
}

type Props = Readonly<{
    children: React.ReactNode;
}>
export default function PausedProvider({ children }: Props) {
    const [paused, setPausedInner] = useState(false);
    
    function setPaused(next: boolean) {
        setPausedInner(prev => {
            if (prev == next) return prev;
            invoke("pause");
            return next;
        });
    }
    
    return (
        <PausedContext.Provider value={[paused, setPaused]}>
            { children }
        </PausedContext.Provider>
    );
}