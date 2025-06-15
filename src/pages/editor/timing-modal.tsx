import Modal from "../../components/modal"
import { ChartMetadata } from "../../providers/page";


type Props = Readonly<{
    metadata: ChartMetadata
    setMetadata: (metadata: ChartMetadata) => void
    onClose: () => void
}>
export default function TimingModal({ metadata, setMetadata, onClose }: Props) {
    return (
        <Modal title="timing" onClose={onClose}>
            <NumberInput label="BPM" value={metadata.bpm} onChange={bpm => setMetadata({...metadata, bpm})} />
            <NumberInput label="measure size" value={metadata.measure_size} onChange={measure_size => setMetadata({...metadata, measure_size})} />
            <NumberInput label="snaps" value={metadata.snaps} onChange={snaps => setMetadata({...metadata, snaps})} />
        </Modal>
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