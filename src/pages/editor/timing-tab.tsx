import { TriangleAlert } from "lucide-react";
import MuseButton from "../../components/muse-button";
import { Bind, ChartMetadata } from "../../lib/lib";
import NumberInput from "../../components/number-input";


type Props = Readonly<{
    metadata: ChartMetadata
    setMetadata: (metadata: ChartMetadata) => void
    setOffsetHere: () => any
    setPreviewHere: () => any
}>
export default function TimingTab({ metadata, setMetadata, setOffsetHere, setPreviewHere }: Props) {
    
    function bindMetadata<K extends keyof ChartMetadata>(field: K): Bind<ChartMetadata[K]> {
        return [
            metadata[field], 
            input => setMetadata({...metadata, [field]: input})
        ];
    }
    
    return (
        <div className="absolute cover flex justify-center items-center">
            <div style={{fontSize: "calc(max(3vh, 16px))"}} className="w-fit flex gap-[5vw] p-5 items-center">
                
                <div className="w-fit rounded-md outline-2 outline-ctp-red flex flex-col items-center p-3">
                    <h2 className="text-[1.5em] text-ctp-red!"> <TriangleAlert /> Important </h2>
                    <p> confirm that offset/BPM are correct before you begin! </p>
                    <p> otherwise, your notes may not align with the beat. </p>
                    
                    <div className="mt-5 flex flex-col items-center w-full [&>*]:w-full">
                        
                        <MuseButton 
                            className="[--btn-color:var(--color-ctp-teal)] outline-btn mb-3 w-fit!"
                            onClick={setOffsetHere}
                        > set offset to current position </MuseButton>
                        <NumberInput label="BPM" bind={bindMetadata("bpm")} largeIncrements min={1} />
                    </div>
                </div>
                
                <div className="flex flex-col gap-3 items-center">
                    <h2 className="mt-8"> these values may be edited freely while you chart this song  </h2>
                    <div className="w-full [&>*]:w-full [&>*]:mb-3">
                        <NumberInput label="measure size" bind={bindMetadata("measure_size")} min={1} />
                        <NumberInput label="snaps" bind={bindMetadata("snaps")} min={0} />
                    </div>
                    <MuseButton 
                        className="[--btn-color:var(--color-ctp-green)] outline-btn"
                        onClick={setPreviewHere}
                    > set preview time to current position </MuseButton>
                </div>
            </div>
        </div>
    );
}