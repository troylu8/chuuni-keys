
type Props = Readonly<{
    offset: number
    setOffset: (offset: number) => any
    onClose: () => any
}>
export default function OffsetEditor({ offset, setOffset, onClose }: Props) {
    
    return (
        <div className="grid-cols-2">
            { offset }
        </div>
    );
}