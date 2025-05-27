import { convertFileSrc } from "@tauri-apps/api/core";
import {  usePage } from "../providers/page";
import { ChartMetadata } from "../providers/user-data";


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