import { convertFileSrc } from "@tauri-apps/api/core";

type Props = Readonly<{
    imgPath?: string
    imgCacheBust?: string
}>
export default function Background({ imgPath, imgCacheBust }: Props) {
    
    const src = imgPath && convertFileSrc(imgPath);
    
    return (
        <>
            { imgPath &&
                <div className="absolute cover -z-10">
                    <img 
                        src={imgCacheBust? `${src}?v=${imgCacheBust}` : src}
                        className="w-full h-full object-cover brightness-50"
                    ></img>
                </div>
            }
        </>
    );
}