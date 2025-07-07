import { convertFileSrc } from "@tauri-apps/api/core";

type Props = Readonly<{
    imgPath?: string
    imgCacheBust?: string
    brightness?: number
}>
export default function Background({ imgPath, imgCacheBust, brightness }: Props) {
    const src = imgPath && convertFileSrc(imgPath);
    
    return (
        <>
            { src &&
                <div className="absolute cover -z-10">
                    <img 
                        src={imgCacheBust? `${src}?v=${imgCacheBust}` : src}
                        style={{filter: `brightness(${brightness ?? 30}%)`}}
                        className="w-full h-full object-cover"
                    ></img>
                </div>
            }
        </>
    );
}