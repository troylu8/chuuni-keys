import { TriangleAlert } from "lucide-react";
import MuseButton from "../../components/muse-button";
import { Bind, ChartMetadata } from "../../lib/lib";
import NumberInput from "../../components/number-input";
import { useBgmState } from "../../contexts/bgm-state";
import bgm from "../../lib/sound";


type Props = Readonly<{
    metadata: ChartMetadata
    setMetadata: (metadata: ChartMetadata) => void
}>
export default function TimingTab({ metadata, setMetadata }: Props) {
    const { duration } = useBgmState();
    
    function bindMetadata<K extends keyof ChartMetadata>(field: K): Bind<ChartMetadata[K]> {
        return [
            metadata[field], 
            input => setMetadata({...metadata, [field]: input})
        ];
    }
    
    return (
        <div className="absolute cover flex justify-center items-center">
            <div style={{fontSize: "calc(max(3vh, 12px))"}} className="w-fit flex gap-[5vw] p-5 items-center">
                
                <div className="w-fit rounded-md outline-2 outline-ctp-red flex flex-col items-center p-3">
                    <h2 className="text-[1.5em] text-ctp-red!"> <TriangleAlert /> Important </h2>
                    <p> confirm that BPM/offset are correct before you begin! </p>
                    <p> otherwise, your notes may not align with the beat. </p>
                    
                    <div className="mt-5 flex flex-col items-center w-full [&>*]:w-full gap-3">
                        <NumberInput label="BPM" bind={bindMetadata("bpm")} largeIncrements min={1} />
                        
                        <div className="mt-5">
                            <NumberInput 
                                label="offset" 
                                bind={bindMetadata("first_beat")} 
                                min={0}
                                max={duration}
                                largeIncrements 
                            />
                        </div>
                        <MuseButton 
                            className="text-ctp-base bg-ctp-teal self-center w-fit!"
                            onClick={() => setMetadata({...metadata, first_beat: bgm.pos})}
                        > 
                            set offset to current position 
                        </MuseButton>
                    </div>
                </div>
                
                <div className="flex flex-col gap-3 items-center">
                    <h2 className="mt-8"> these values may be edited freely while you chart this song  </h2>
                    <div className="w-full [&>*]:w-full [&>*]:mb-3">
                        <NumberInput label="measure size" bind={bindMetadata("measure_size")} min={1} />
                        <NumberInput label="snaps" bind={bindMetadata("snaps")} min={0} />
                        <div className="mt-10">
                            <NumberInput 
                                label="preview time" 
                                bind={bindMetadata("preview_time")} 
                                min={0}
                                max={duration}
                                largeIncrements 
                            />
                        </div>
                    </div>
                    <MuseButton 
                        className="text-ctp-base bg-ctp-yellow"
                        onClick={() => setMetadata({...metadata, preview_time: bgm.pos})}
                    > 
                        set preview time to current position 
                    </MuseButton>
                </div>
            </div>
        </div>
    );
}