import GameStateProvider from "../../providers/game-state";
import DeltaProvider from "../../providers/delta";
import AccuracyBar from "./accuracy-bar";
import Keyboard from "./keyboard";
import PauseMenu from "./pause-menu";
import Background from "./background";

export default function Game() {
    
    return (
        <GameStateProvider>
            <div className="fixed cover">
                <PauseMenu />
                <Background />
                <DeltaProvider>
                    <Keyboard />
                    <AccuracyBar />
                </DeltaProvider>
            </div>
        </GameStateProvider>
    );
}