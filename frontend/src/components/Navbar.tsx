"use client";
import Link from "next/link";
import Image from "next/image";
import ModeToggle from "@/components/ModeToggle";
import ConnectButton from "@/components/WalletConnect";

export default function Navbar() {
  return (
    <nav className="bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Left: Logo and Brand */}
          <Link href="/" className="flex items-center space-x-2">
            <Image src="/logo.svg" alt="UmiMarket Logo" width={32} height={32} />
            <span className="text-2xl font-semibold text-gray-900 dark:text-white">
              PredictMI
            </span>
          </Link>

          {/* Center: Navigation Links */}
          <div className="hidden sm:flex sm:space-x-6">
            <Link
              href="/"
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium"
            >
              Markets
            </Link>
            <Link
              href="/dashboard"
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium"
            >
              Dashboard
            </Link>
            <Link
              href="/market/create"
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium"
            >
              Create
            </Link>
          </div>

          {/* Right: Theme Toggle and Wallet Connect */}
          <div className="flex items-center space-x-4">
            <ModeToggle />
            <ConnectButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
