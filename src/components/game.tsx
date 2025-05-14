import { invoke } from "@tauri-apps/api/core";
import StartTimeProvider from "../providers/start-time";
import KeyUnit from "./key-unit";
import PausedProvider, { usePaused } from "../providers/paused";
import { useEffect } from "react";

export default function Game() {
    
    return (
        <>
            <StartTimeProvider>
                <PausedProvider>
                    <GameInner />
                </PausedProvider>
            </StartTimeProvider>
            
            <button className="cursor-pointer" onClick={() => {
                console.log("sending start");
                invoke("start_chart", {filepath: "charts/my-chart.muse"})
            }} > play </button> 
        </>
    );
}

function GameInner() {
    const [paused, setPaused] = usePaused();
    
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") setPaused(!paused); 
        }
        
        window.addEventListener("keydown", handleKeyDown);
        
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        }
    })
    
    return (
        <>
            { paused && <PauseMenu /> }
            <Keyboard />
        </>
    )
}

function PauseMenu() {
    
    return (
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
    )
}

function Keyboard() {
    return (
        <div className="fixed top-50 left-0 right-0 bottom-0 flex justify-center items-center">
            <KeyUnit keyCode=" " hitringEvent=":space"> spc </KeyUnit>
        </div>
    );
}