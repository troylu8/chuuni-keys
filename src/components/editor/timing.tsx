

type Props = Readonly<{
    bpm: number | null
    offset: number | null
    setBPM: (bpm: number) => void
    setOffset: (offset: number) => void
}>
export default function Timing({ bpm, offset, setBPM, setOffset }: Props) {

    return (
        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex gap-5">
            <NumberInput label="BPM" value={bpm} onChange={setBPM} />
            <NumberInput label="offset" value={offset} onChange={setOffset} />
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
        <div className="flex flex-col gap-3">
            <p> {label} </p>
            <input type="number" value={value ?? "-1"} onChange={e => onChange(Number(e.currentTarget.value))} />
        </div>
    )
}