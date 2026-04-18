import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyAccessCookieValue, getAccessCookieName } from "@/lib/access-cookie";
import QRScanner from "@/components/QRScanner";

export default async function IndexPage() {
  const cookieStore = await cookies();
  const value = cookieStore.get(getAccessCookieName())?.value;
  const hasAccess = value != null && (await verifyAccessCookieValue(value));

  if (hasAccess) {
    redirect("/menu");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 dark:bg-zinc-950 p-6">
      <div className="w-full max-w-md text-center space-y-6">
        <h1 className="text-2xl font-serif font-bold text-zinc-900 dark:text-white">
          Scan table QR code
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Point your camera at the QR code on your table to open the menu.
        </p>
        <QRScanner />
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          Or open the link from the QR code in any browser to go straight to the menu.
        </p>
      </div>
    </div>
  );
}
