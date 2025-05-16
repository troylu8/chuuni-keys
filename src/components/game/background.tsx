import { convertFileSrc } from "@tauri-apps/api/core";
import { GameInfo, usePage } from "../../providers/page";


export default function Background() {
    const [pageParams] = usePage();
    
    const { imgPath } = pageParams[1] as GameInfo;
    
    return (
        <>
            { imgPath &&
                <img 
                    src={convertFileSrc(imgPath)}
                    className="w-full h-full object-cover"
                ></img>
            }
        </>
    );
}