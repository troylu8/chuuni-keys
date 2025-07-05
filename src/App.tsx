import { USERDATA_DIR } from "./lib/globals";
import { AudioPlayer } from "./lib/sound";


const audio = new AudioPlayer();

export default function App() {
    
    async function handleClickA() {
        await audio.load(USERDATA_DIR + "\\testing.mp3");
    }
    async function handleClickB() {
        audio.play();
    }
    async function handleClickC() {
        audio.setSpeed(audio.speed + 0.2);
        console.log(audio.speed);
    }
    async function handleClickD() {
        audio.setSpeed(audio.speed - 0.2);
        console.log(audio.speed);
    }
   
    return (
        <>
            <button onClick={handleClickA}> a </button>
            <button onClick={handleClickB}> b </button>
            <button onClick={handleClickC}> c </button>
            <button onClick={handleClickD}> d </button>
        </>
    );
}