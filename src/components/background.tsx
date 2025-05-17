import { convertFileSrc } from "@tauri-apps/api/core";
import { GamePaths, usePage } from "../providers/page";


export default function Background() {
    const [pageParams] = usePage();
    
    const { imgPath } = pageParams[1] as GamePaths;
    
    return (
        <>
            { imgPath &&
                <div className="fixed cover">
                    <img 
                        src={convertFileSrc(imgPath)}
                        className="w-full h-full object-cover"
                    ></img>
                    
                </div>
            }
        </>
    );
}