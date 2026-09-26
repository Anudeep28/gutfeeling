import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Molecular Table",
  description: "Trace food chemicals from structure to biological impact.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
