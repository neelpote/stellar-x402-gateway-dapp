import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Sofia_Sans } from "next/font/google";

const sofiaSans = Sofia_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-sofia-sans",
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <main className={`${sofiaSans.variable} font-sans min-h-screen bg-[#F3F0EE]`}>
      <Component {...pageProps} />
    </main>
  );
}
