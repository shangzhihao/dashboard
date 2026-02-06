import type { Metadata } from 'next';
import 'antd/dist/reset.css';
import './globals.css';
import Providers from './providers';
import { siteConfig } from '../config/site';

export const metadata: Metadata = {
  title: 'Futures Dashboard',
  description: 'Futures analytics dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={siteConfig.language.default}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
