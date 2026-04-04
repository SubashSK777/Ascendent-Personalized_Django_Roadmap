import "../styles/globals.css";

export const metadata = {
  title: "A-Flick Dashboard",
  description: "Minimal clean dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
