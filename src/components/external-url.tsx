import { openUrl } from "@tauri-apps/plugin-opener";

type Props = Readonly<{
    url: string,
    label?: string
}>
export default function ExternalUrl({ url, label = url }: Props) {
    return (
        <span
            onClick={() => openUrl(url)}
            className="text-ctp-mauve hover:underline cursor-pointer"
        > { label } </span>
    );
}