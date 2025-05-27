import GameManager, { GameState, useGameState } from "../../providers/game-manager";
import DeltaProvider from "../../providers/score";
import AccuracyBar from "./accuracy-bar";
import KeyboardLayout from "../../components/keyboard-layout";
import PauseMenu from "./pause-menu";
import Background from "../../components/background";
import Combo from "./combo";
import Results from "./results";
import KeyUnitGame from "./key-unit-game";

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
                        <AccuracyBar />
                        <Combo />
                        
                        <KeyboardLayout keyComponent={key => 
                            <KeyUnitGame 
                                key={key} 
                                keyCode={key} 
                                hitringEvent={":" + key}    
                            >
                                { key }
                            </KeyUnitGame>
                        } />
                    </>
                }
                { gameState == GameState.ENDED && <Results /> }
            </DeltaProvider>
        </div>
    )
}