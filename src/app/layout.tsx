import ClientProvider from "@/components/providers/ClientProvider";
import "./globals.css"

export const metadata = {
  title: "My App",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ClientProvider>{children}</ClientProvider>
      </body>
    </html>
  );
}
