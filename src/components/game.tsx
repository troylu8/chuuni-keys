import { invoke } from "@tauri-apps/api/core";
import StartTimeProvider from "../providers/start-time";
import KeyUnit from "./key-unit";
import PausedProvider, { usePaused } from "../providers/paused";
import { useEffect, useState } from "react";
import DeltaProvider, { useDelta } from "../providers/delta";

export default function Game() {
    
    return (
        <>
            <StartTimeProvider>
                <PausedProvider>
                    <PauseMenu />
                    <DeltaProvider>
                        <Keyboard />
                        <AccuracyBar />
                    </DeltaProvider>
                </PausedProvider>
            </StartTimeProvider>
            
            <button className="cursor-pointer" onClick={() => {
                console.log("sending start");
                invoke("load_chart", {filepath: "charts/my-chart.muse"})
            }} > play </button> 
        </>
    );
}


function PauseMenu() {
    const [paused, togglePaused] = usePaused();
    
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") togglePaused(); 
        }
        
        window.addEventListener("keydown", handleKeyDown);
        
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        }
    }, []);
    
    return (
        <>
            { paused && 
                <div 
                    className="
                        fixed left-0 right-0 top-0 bottom-0 z-10
                        flex flex-col justify-center items-center gap-3
                    "
                >
                    <button> resume </button>
                    <button> restart </button>
                    <button> quit </button>
                </div>
            }
        </>
    )
}

function Keyboard() {
    return (
        <div className="fixed top-50 left-0 right-0 bottom-0 flex justify-center items-center">
            <KeyUnit keyCode=" " hitringEvent=":space"> spc </KeyUnit>
        </div>
    );
}

function AccuracyBar() {
    const [_, addDeltaListener] = useDelta();
    const [deltas, setDeltas] = useState<number[]>([]);
    
    useEffect(() => {
        const unlisten = addDeltaListener(delta => {
            setDeltas(prev => [...prev, delta]);
            
            setTimeout(() => {
                setDeltas(prev => {
                    const next = [...prev];
                    next.shift();
                    return next;
                });
            }, 500);
        });
        
        return unlisten;
    }, []);
    
    return (
        <div>
            {
                deltas.map(d => <p>{d}</p>)
            }
        </div>
    )
}