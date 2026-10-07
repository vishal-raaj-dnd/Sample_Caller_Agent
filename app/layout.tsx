import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Metro Health | AI Voice Booking System',
  description: 'AI-native clinical appointment booking agent built on Retell AI and PostgreSQL.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
