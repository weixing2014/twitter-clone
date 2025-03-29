import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'OhYeah',
  description: 'Share your thoughts with the world. Simple, fast, social.',
  icons: {
    icon: '/logo.svg',
    apple: '/logo.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body className={inter.className}>
        <AuthProvider>
          <div className='min-h-screen bg-white dark:bg-gray-950'>
            <Navbar />
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
