import GameManager, { GameState, useGameState } from "../../providers/game-manager";
import DeltaProvider, { useStats } from "../../providers/score";
import AccuracyBar from "./accuracy-bar";
import Keyboard from "./keyboard";
import PauseMenu from "./pause-menu";
import Background from "./background";
import Combo from "./combo";
import Results from "./results";

export default function Game() {
    return (
        <GameManager>
            <GameInner />
        </GameManager>
    );
}

function GameInner() {
    const [gameState] = useGameState();
    
    return (
        <div className="fixed cover">
            <Background />
            { gameState == GameState.LOADING && <p> loading... </p> }
            
            <DeltaProvider>
                { gameState == GameState.STARTED &&
                    <>
                        <PauseMenu />
                        <Keyboard />
                        <AccuracyBar />
                        <Combo />
                    </>
                }
                { gameState == GameState.ENDED && <Results /> }
            </DeltaProvider>
        </div>
    )
}