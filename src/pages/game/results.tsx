import { useEffect } from "react";
import { Page, usePage } from "../../contexts/page";
import { PRAISE_COLORS, useStats } from "../../contexts/score";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { ChartMetadata, getChartFolder } from "../../lib/lib";
import MuseButton from "../../components/muse-button";

const SCORE_WEIGHTS = {
    perfect: 3,
    good: 2,
    miss: 0
}

function calculateLetter(accuracy: number, fullCombo: boolean) {
    const LETTERS = ["F", "C", "B", "A", "S", "S+", "X"];
    const ACCURACY_REQS = [0, 0.3, 0.5, 0.7, 0.9, 1];
    
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
        setPage([Page.CHART_SELECT]); 
        
        if (!params) return;
        writeTextFile(
            getChartFolder(metadata) + "\\leaderboard.csv", 
            `${Date.now()},${accuracyPercent},${maxCombo},${letter}${fullCombo? ",FC" : ""}\n`,
            {append: true}
        );
    }
    
    return (
        <div className="absolute cover flex flex-col justify-center items-center gap-3 z-20 text-[5vh]">
            <p style={{fontSize: "7em", lineHeight: 1}} className="text-ctp-red font-serif"> {letter} </p>
            <p>
                <span style={{color: PRAISE_COLORS["perfect"]}}> {perfect} </span> /
                <span style={{color: PRAISE_COLORS["good"]}}> {good} </span> /
                <span style={{color: PRAISE_COLORS["miss"]}}> {miss} </span>
            </p>
            <div className="grid grid-cols-2 gap-y-3 gap-x-6 ">
                <p className="text-end"> accuracy </p>
                <p> { accuracyPercent }% </p>
                
                <p className="text-end"> max combo </p>
                <p> { maxCombo }x </p>
            </div>
            
            <MuseButton 
                onClick={handleToChartSelect}
                className="self-center mt-[10vh] text-ctp-base bg-ctp-mauve"
            > back to song select </MuseButton>
        </div>
    )
}