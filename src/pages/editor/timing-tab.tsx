import { ChartMetadata } from "../../providers/page";


type Props = Readonly<{
    metadata: ChartMetadata
    setMetadata: (metadata: ChartMetadata) => void
}>
export default function TimingTab({ metadata, setMetadata }: Props) {
    return (
        <div className="absolute cover flex justify-center items-center">
            <div className="w-fit bg-background p-3 rounded-md">
                <NumberInput label="BPM" value={metadata.bpm} onChange={bpm => setMetadata({...metadata, bpm})} />
                <NumberInput label="measure size" value={metadata.measure_size} onChange={measure_size => setMetadata({...metadata, measure_size})} />
                <NumberInput label="snaps" value={metadata.snaps} onChange={snaps => setMetadata({...metadata, snaps})} />
            </div>
        </div>
    );
}

type NumberInputProps = Readonly<{
    value?: number
    label: string,
    onChange: (num: number) => void
}>
function NumberInput({ value, label, onChange }: NumberInputProps) {
    return (
        <div className="flex gap-3 justify-between text-nowrap">
            <label htmlFor={label}> {label} </label>
            <input 
                id={label}
                type="number" 
                value={value ?? "-1"} 
                onChange={e => onChange(Number(e.currentTarget.value))}
                className="w-20"
            />
        </div>
    )
}