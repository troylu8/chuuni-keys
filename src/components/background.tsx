import { convertFileSrc } from "@tauri-apps/api/core";
import {  ChartMetadata, usePage } from "../providers/page";


export default function Background() {
    const [pageParams] = usePage();
    
    const { img } = pageParams[1] as ChartMetadata;
    
    return (
        <>
            { img &&
                <div className="fixed cover">
                    <img 
                        src={convertFileSrc(img)}
                        className="w-full h-full object-cover brightness-50"
                    ></img>
                </div>
            }
        </>
    );
}