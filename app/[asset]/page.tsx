import { MarketTerminal } from '@/components/MarketTerminal';
export default function AssetSignals({ params }: { params: { asset: string } }) { return <MarketTerminal assetId={params.asset}/>; }
