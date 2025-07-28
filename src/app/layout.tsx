
import type {Metadata} from 'next';
import './globals.css';
import { Providers } from './providers';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'DRESSX',
  description: 'Your AI-powered virtual closet',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-body antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}


// EXTRAS
            </motion.p>
          </motion.div>
        );
      case 'welcome':
        return (
          <motion.div
            key="welcome"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={cardVariants}
            className="flex flex-col items-center justify-center text-center text-white p-6 bg-gray-800 rounded-lg shadow-lg"
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-4">Welcome to DRESSX</h2>
            <p className="text-lg md:text-xl text-muted-foreground mb-6">
              Explore your virtual closet and discover the future of fashion.
            </p>
            <button
              onClick={onComplete}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-300"
            >
              Get Started
            </button>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      {renderStep()}
    </div>
  );
}
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { motion } from 'framer-motion';
import React from 'react';