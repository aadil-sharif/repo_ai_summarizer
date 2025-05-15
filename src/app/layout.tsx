import { ReactNode } from "react";
import { ChakraProvider } from "@chakra-ui/react";
import { AuthProvider } from "@/lib/auth-provider";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ChakraProvider>{children}</ChakraProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
