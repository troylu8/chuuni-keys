import { invoke } from "@tauri-apps/api/core";
import KeyIcon from './components/key-icon';
import "./app.css"

export default function App() {
    
    
    
    
    return (
        <>
            <div className="fixed top-50 left-0 right-0 bottom-0 flex justify-center items-center">
                <KeyIcon keyCode=" " hitringEvent="space"> spc </KeyIcon>
            </div>
            <button className="cursor-pointer" onClick={() => {
                console.log("sending start");
                invoke("start_chart", {filepath: "charts/my-chart.muse"})
            }} > play </button> 
        </>
    );
}