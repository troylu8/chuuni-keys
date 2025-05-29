

type Props = Readonly<{
    bpm: number | null
    measureSize: number | null
    snaps: number
    setBPM: (bpm: number) => void
    setMeasureSize: (measureSize: number) => void
    setSnaps: (snaps: number) => void
}>
export default function Timing({ bpm, measureSize, snaps, setBPM, setMeasureSize, setSnaps }: Props) {

    return (
        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex flex-col gap-1 ">
            <NumberInput label="BPM" value={bpm} onChange={setBPM} />
            <NumberInput label="measure size" value={measureSize} onChange={setMeasureSize} />
            <NumberInput label="snaps" value={snaps} onChange={setSnaps} />
        </div>
    );
}

type NumberInputProps = Readonly<{
    value: number | null
    label: string,
    onChange: (num: number) => void
}>
function NumberInput({ value, label, onChange }: NumberInputProps) {
    return (
        <div className="flex gap-3 justify-between text-nowrap">
            <p> {label} </p>
            <input 
                type="number" 
                value={value ?? "-1"} 
                onChange={e => onChange(Number(e.currentTarget.value))}
                className="w-20"
            />
        </div>
    )
}