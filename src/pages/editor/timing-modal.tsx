import Modal from "../../components/modal"


type Props = Readonly<{
    bpm: number | null
    measureSize: number | null
    snaps: number
    setBPM: (bpm: number) => void
    setMeasureSize: (measureSize: number) => void
    setSnaps: (snaps: number) => void
    onClose: () => void
}>
export default function TimingModal({ bpm, measureSize, snaps, setBPM, setMeasureSize, setSnaps, onClose }: Props) {
    return (
        <Modal title="timing" onClose={onClose}>
            <NumberInput label="BPM" value={bpm} onChange={setBPM} />
            <NumberInput label="measure size" value={measureSize} onChange={setMeasureSize} />
            <NumberInput label="snaps" value={snaps} onChange={setSnaps} />
        </Modal>
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