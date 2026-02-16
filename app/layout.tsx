import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SingAlong Video Management",
  description: "Manage your singalong video library",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
