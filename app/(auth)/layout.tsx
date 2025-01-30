import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { Toaster } from "react-hot-toast";
import { HotelsProvider } from "@/contexts/hotel-context";
import { DepartmentsProvider, PRProvider, UsersProvider, VendorsProvider } from "@/contexts";
import { PIProvider } from "@/contexts/pi-context";
import { RolesProvider } from "@/contexts/role-context";
import { LedgersProvider } from "@/contexts/ledger-context";
import { MonthlyPaymentLedgersProvider } from "@/contexts/mp-ledger-context";
import { PaymentGroupsProvider } from "@/contexts/payment-group-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Login - Udaan Cashflow",
  description: "A cashflow management dashboard login page.",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <RolesProvider>
            <PaymentGroupsProvider>
              <MonthlyPaymentLedgersProvider>
                <LedgersProvider>
                  <UsersProvider>
                    <DepartmentsProvider>
                      <VendorsProvider>
                        <HotelsProvider>
                          <PRProvider>
                            <PIProvider>
                              {children}
                              <Toaster position="top-right" />
                            </PIProvider>
                          </PRProvider>
                        </HotelsProvider>
                      </VendorsProvider>
                    </DepartmentsProvider>
                  </UsersProvider>
                </LedgersProvider>
              </MonthlyPaymentLedgersProvider>
            </PaymentGroupsProvider>
          </RolesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
