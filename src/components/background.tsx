import { convertFileSrc } from "@tauri-apps/api/core";
import {  GameAndEditorParams, usePage } from "../providers/page";


export default function Background() {
    const [[_, params]] = usePage();
    
    const { song_folder, img } = params as GameAndEditorParams;
    
    return (
        <>
            { img &&
                <div className="fixed cover">
                    <img 
                        src={convertFileSrc(song_folder + img)}
                        className="w-full h-full object-cover brightness-50"
                    ></img>
                </div>
            }
        </>
    );
}