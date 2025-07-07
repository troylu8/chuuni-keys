import { convertFileSrc } from "@tauri-apps/api/core";
import { ChartMetadata, getChartFolder } from "../../lib/lib";

type Props = Readonly<{
    metadata: ChartMetadata
    onClick: () => any
    active: boolean
}>
export default function ChartEntry({ metadata, onClick, active }: Props) { //TODO use "active"
    
    return (
        <section 
            className="relative shrink-0 w-fit"
            onClick={onClick}
        >            
            {/* thumbnail */}
            <div className="relative w-[25vh] h-[25vh] overflow-hidden rotate-45 rounded-[25%] z-10">
                <img 
                    src={metadata.img_ext && convertFileSrc(`${getChartFolder(metadata)}\\img.${metadata.img_ext}`)} //TODO default img
                    className='absolute cover w-full h-full scale-125 object-cover -rotate-45'
                />
            </div>
            
            {/* difficulty label */}
            <div className='
                absolute top-1/2 -translate-y-1/2 left-full -translate-x-1/2 ml-[7vh]
                w-[10vh] h-[10vh] bg-red-400 rotate-45 rounded-[25%]
                flex justify-center items-center z-20
            '>
                <div className='-rotate-45 text-[5vh]'>4.1</div>
            </div>
            
            {/* song title / producer label */}
            <header 
                style={{
                    border: "solid 5px",
                    borderImage: "linear-gradient(to right, var(--color1), rgba(0, 0, 0, 0) 80%) 100% 1"
                }}
                className='
                    absolute left-1/2 top-1/10 bottom-1/10 text-foreground text-nowrap 
                    flex flex-col justify-center pl-[27vh] w-[50vw]
                '
            >
                <p className='text-[6vh]'> {metadata.title} </p>
                <p className='text-[3vh]'> {metadata.credit_audio} </p>
            </header>
        </section>
    )
}