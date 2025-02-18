import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import { Geist, Geist_Mono } from "next/font/google";


import "../globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import SidebarLayout from "@/components/layout/wrapper";
import { HotelsProvider } from "@/contexts/hotel-context";
import { DepartmentsProvider, PRProvider, UsersProvider, VendorsProvider } from "@/contexts";
import { PIProvider } from "@/contexts/pi-context";
import { RolesProvider } from "@/contexts/role-context";
import { LedgersProvider } from "@/contexts/ledger-context";
import { MonthlyPaymentLedgersProvider } from "@/contexts/mp-ledger-context";
import { PaymentGroupsProvider } from "@/contexts/payment-group-context";
import { ReportsProvider } from "@/contexts/report-context";
import { startCronJobs } from "@/lib/cron";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dashboard - Cashflow",
  description: "Udaan Cashflow Management System Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  startCronJobs();
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
                              <ReportsProvider>
                                <SidebarLayout>
                                  {children}
                                  <Toaster position="top-right" />
                                </SidebarLayout>
                              </ReportsProvider>
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
