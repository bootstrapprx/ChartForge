import type { AppProps } from 'next/app';
import dynamic from 'next/dynamic';
import '@/index.css';

// Load the existing React SPA (uses react-router) purely on the client.
const SpaApp = dynamic(() => import('../src/App'), { ssr: false });

export default function MyApp(_props: AppProps) {
  return <SpaApp />;
}
