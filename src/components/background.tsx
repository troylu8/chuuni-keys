import { convertFileSrc } from "@tauri-apps/api/core";

type Props = Readonly<{
    imgPath?: string 
}>
export default function Background({ imgPath }: Props) {
    
    console.log("rerender bg with img", imgPath);
    
    return (
        <>
            { imgPath &&
                <div className="fixed cover">
                    <img 
                        src={convertFileSrc(imgPath)}
                        className="w-full h-full object-cover brightness-50"
                    ></img>
                </div>
            }
        </>
    );
}