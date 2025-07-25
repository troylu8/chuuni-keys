import { convertFileSrc } from "@tauri-apps/api/core";
import { RESOURCE_DIR } from "../lib/lib";

type Props = Readonly<{
    imgPath?: string
    imgCacheBust?: string
    brightness?: number
}>
export default function Background({ imgPath, imgCacheBust, brightness }: Props) {
    const src = convertFileSrc(imgPath ?? RESOURCE_DIR + "\\default-bg.png");
    
    return (
        <>
            { src &&
                <div className="absolute cover -z-10">
                    <img 
                        src={imgCacheBust? `${src}?v=${imgCacheBust}` : src}
                        style={{filter: `brightness(${brightness ?? 40}%)`}}
                        className="w-full h-full object-cover"
                    ></img>
                </div>
            }
        </>
    );
}