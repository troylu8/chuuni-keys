import { useEffect } from "react";
import { ChartMetadata, Page, usePage } from "../../providers/page";
import { useStats } from "../../providers/score";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { getChartFolder } from "../../lib/globals";

const SCORE_WEIGHTS = {
    perfect: 3,
    good: 1,
    miss: 0
}

function calculateLetter(accuracy: number, fullCombo: boolean) {
    const LETTERS = ["C", "B", "A", "S", "S+"];
    const ACCURACY_REQS = [0, 0.75, 0.85, 0.95];
    
    for (let i = ACCURACY_REQS.length-1; i >= 0; i--) {
        if (accuracy >= ACCURACY_REQS[i]) {
            return LETTERS[i + Number(fullCombo)]; // having full combo increases letter by 1
        }
    }
}

export default function Results() {
    const [[,params], setPage] = usePage();
    const metadata = params as ChartMetadata;
    
    const { perfect, good, miss, maxCombo } = useStats();
    
    const fullCombo = miss == 0;
    
    const maxScore = (perfect + good + miss) * SCORE_WEIGHTS["perfect"];
    const accuracy = 
        (
            perfect * SCORE_WEIGHTS["perfect"] + 
            good * SCORE_WEIGHTS["good"] + 
            miss * SCORE_WEIGHTS["miss"]
        ) / maxScore;
    const accuracyPercent = (accuracy * 100).toFixed(3);
    
    const letter = calculateLetter(accuracy, fullCombo);
    
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") handleToChartSelect();
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => { window.removeEventListener("keydown", handleKeyDown); }
    }, [metadata]);
    
    
    function handleToChartSelect() {
        setPage([Page.CHART_SELECT, {isEditing: false}]); 
        
        if (!params) return;
        writeTextFile(
            getChartFolder(metadata) + "\\leaderboard.csv", 
            `${Date.now()},${accuracyPercent},${maxCombo},${letter}${fullCombo? ",FC" : ""}\n`,
            {append: true}
        );
    }
    
    return (
        <div className="absolute cover flex flex-col justify-center items-center gap-3 z-20">
            <p className="text-9xl"> {letter} </p>
            <p>
                <span> {perfect} </span> /
                <span> {good} </span> /
                <span> {miss} </span>
            </p>
            <div className="grid grid-cols-2 gap-3 ">
                <p className="text-end"> accuracy </p>
                <p> { accuracyPercent }% </p>
                
                <p className="text-end"> max combo </p>
                <p> { maxCombo }x </p>
            </div>
            
            <button 
                onClick={handleToChartSelect}
                className="self-center"
            > back to song select </button>
        </div>
    )
}