"use client";

import { useState } from "react";
import axios from "axios";
import { BellRing, LoaderCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ProfilePhoneCardProps = {
  initialPhoneNumber: string | null;
  initialAddress: string | null;
};

export function ProfilePhoneCard({
  initialPhoneNumber,
  initialAddress,
}: ProfilePhoneCardProps) {
  const [open, setOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber ?? "");
  const [address, setAddress] = useState(initialAddress ?? "");
  const [savedPhoneNumber, setSavedPhoneNumber] = useState(
    initialPhoneNumber ?? "",
  );
  const [savedAddress, setSavedAddress] = useState(initialAddress ?? "");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const hasPhoneNumber = Boolean(savedPhoneNumber);

  const handleSave = async () => {
    const value = phoneNumber.trim();

    if (!value) {
      setError("Please enter your mobile number.");
      return;
    }

    try {
      setIsSaving(true);
      setError("");

      const result = await axios.patch("/api/user/phone", {
        phoneNumber: value,
        address,
      });

      setSavedPhoneNumber(result.data.phoneNumber ?? value);
      setPhoneNumber(result.data.phoneNumber ?? value);
      setSavedAddress(result.data.address ?? address);
      setAddress(result.data.address ?? address);
      setOpen(false);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.error ?? "Unable to save your mobile number.",
        );
      } else {
        setError("Unable to save your mobile number.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-[1.6rem] border border-amber-200">
      <div className="p-5 md:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
            {hasPhoneNumber ? (
              <Phone className="h-5 w-5" />
            ) : (
              <BellRing className="h-5 w-5" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-[0.24em] text-amber-700">
              Mobile updates
            </p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">
              {hasPhoneNumber
                ? "Your personalized update line is active."
                : "Add your mobile number for personalized updates."}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {hasPhoneNumber
                ? "We can use this number for more personal gold update experiences and tailored follow-ups."
                : "Highlight your mobile number here so GoldCraft can deliver more personal update flows straight to your phone."}
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-[1.4rem] border border-amber-100 bg-linear-to-r from-amber-50 via-white to-amber-50/80 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-amber-700">
            Saved number
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-900 wrap-break-word">
            {savedPhoneNumber || "Add your phone number now"}
          </p>
          {!hasPhoneNumber ? (
            <p className="mt-2 text-sm leading-6 text-amber-900">
              Add it now to unlock a more personalized mobile update experience.
            </p>
          ) : null}

          <div className="mt-4 border-t border-amber-100 pt-4">
            <p className="text-xs uppercase tracking-[0.22em] text-amber-700">
              Saved address
            </p>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-900 wrap-break-word">
              {savedAddress || "Add your address now"}
            </p>
          </div>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="mt-5 rounded-full cursor-pointer bg-amber-800 text-white hover:bg-amber-900">
              {hasPhoneNumber ? "Update Details Further" : "Add phone number"}
            </Button>
          </DialogTrigger>
          <DialogContent className="border-amber-200 bg-[#fffdf8] sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-slate-900">
                {hasPhoneNumber ? "Update mobile number" : "Add mobile number"}
              </DialogTitle>
              <DialogDescription className="text-slate-600">
                Use your best mobile number so GoldCraft can prepare more personalized updates for you.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <Label htmlFor="phoneNumber" className="text-amber-900">
                Mobile number
              </Label>
              <Input
                id="phoneNumber"
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                placeholder="Enter your mobile number"
                className="border-amber-200 bg-white text-slate-900 focus-visible:ring-amber-200"
              />

              <Label htmlFor="address" className="text-amber-900">
                Address
              </Label>
              <Input
                id="address"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="Enter your complete delivery address"
                className="border-amber-200 bg-white text-slate-900 focus-visible:ring-amber-200"
              />

              {error ? <p className="text-sm text-red-600">{error}</p> : null}
            </div>

            <DialogFooter>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="rounded-full cursor-pointer bg-amber-800 text-white hover:bg-amber-900"
              >
                {isSaving ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Saving
                  </>
                ) : (
                  "Save Details"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}