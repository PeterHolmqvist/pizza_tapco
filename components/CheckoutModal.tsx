"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/hooks/useCart";
import { ProductCustomizerModal } from "@/components/ProductCustomizerModal";

export function CheckoutModal() {
  const router = useRouter();
  const {
    items,
    total,
    clearCart,
    addItem,
    removeItem,
    updateItem,
  } = useCart();

  const [step, setStep] = useState<1 | 2>(1);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [mode, setMode] = useState<"pickup" | "delivery">("pickup");
  const [paymentMethod, setPaymentMethod] = useState<"online" | "in_store">("online");
  const [address, setAddress] = useState("");
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const editingItem = items.find((item) => item.lineId === editingLineId) ?? null;

  const orderText = items
    .map((item) => {
      const sizeLabel =
        item.size === "small" ? "S" : item.size === "medium" ? "M" : "L";
      const base = `${item.quantity}× ${item.product.name} (${sizeLabel})`;
      const parts: string[] = [];

      if (item.removedIngredients?.length) {
        parts.push(`utan ${item.removedIngredients.join(", ")}`);
      }
      if (item.addedExtras?.length) {
        parts.push(`extra ${item.addedExtras.join(", ")}`);
      }
      if (item.specialInstructions) parts.push(`önskemål: ${item.specialInstructions}`);

      return parts.length ? `${base} (${parts.join("; ")})` : base;
    })
    .join(", ");

  async function handleSend() {
    if (isSubmitting) return;
    if (!name.trim() || !phone.trim()) {
      alert("Fyll i namn och telefonnummer.");
      return;
    }

    if (mode === "delivery" && !address.trim()) {
      alert("Fyll i adress för hemleverans.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name,
            phone,
            note,
            mode,
            address: mode === "delivery" ? address : undefined,
          },
          paymentMethod,
          items: items.map((item) => ({
            productId: item.product.id,
            size: item.size,
            quantity: item.quantity,
            selectedOptionIds: (item.selectedOptions ?? []).map((option) => option.id),
            removedIngredients: item.removedIngredients ?? [],
            specialInstructions: item.specialInstructions,
          })),
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Beställningen kunde inte sparas.");
      }

      sessionStorage.setItem("tapco-active-order-tracking", "1");
      clearCart();
      setCheckoutOpen(false);
      setStep(1);
      if (result.checkoutUrl) {
        window.location.assign(result.checkoutUrl);
        return;
      }
      router.push("/order/" + result.trackingToken);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Ett fel uppstod. Försök igen.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const hasItems = items.length > 0;

  return (
    <>
    <Dialog
      open={checkoutOpen}
      onOpenChange={(open) => {
        setCheckoutOpen(open);
        if (!open) {
          setStep(1);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button className="w-full rounded-full bg-red-600 hover:bg-red-700 text-white">
          Gå vidare med beställning
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-slate-900 text-white border border-slate-700 max-w-md w-[90vw]">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? "Granska din beställning" : "Fyll i dina uppgifter"}
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-3 text-sm">
            {!hasItems && (
              <p className="text-slate-400 text-xs">
                Din varukorg är tom. Lägg till något från menyn först.
              </p>
            )}

            {hasItems && (
              <>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {items.map((item) => {
                    const sizeLabel =
                      item.size === "small"
                        ? "S"
                        : item.size === "medium"
                        ? "M"
                        : "L";

                    return (
                      <div
                        key={item.lineId}
                        className="flex justify-between items-center gap-2 border-b border-slate-700/60 pb-1"
                      >
                        <div className="flex min-w-0 flex-1 flex-col">
                          <span>
                            {item.quantity}× {item.product.name} ({sizeLabel})
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {item.unitPrice} kr/st
                          </span>

                          {item.removedIngredients?.length ? (
                            <span className="text-[11px] text-slate-400">
                              utan {item.removedIngredients.join(", ")}
                            </span>
                          ) : null}

                          {item.addedExtras?.length ? (
                            <span className="text-[11px] text-slate-400">
                              extra {item.addedExtras.join(", ")}
                            </span>
                          ) : null}
                          {item.specialInstructions ? (
                            <span className="text-[11px] text-amber-300">Önskemål: {item.specialInstructions}</span>
                          ) : null}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingLineId(item.lineId);
                              setCheckoutOpen(false);
                            }}
                            className="text-[10px] text-slate-300 underline underline-offset-2 hover:text-white"
                          >
                            Ändra
                          </button>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                removeItem(item.product.id, item.size, item.lineId)
                              }
                              className="w-6 h-6 flex items-center justify-center rounded-full border border-slate-600 text-xs"
                            >
                              −
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                addItem(
                                  item.product,
                                  item.size,
                                  item.unitPrice,
                                  { removedIngredients: item.removedIngredients, selectedOptions: item.selectedOptions, specialInstructions: item.specialInstructions }
                                )
                              }
                              className="w-6 h-6 flex items-center justify-center rounded-full border border-slate-600 text-xs"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-2">
                  <Label htmlFor="note" className="text-xs">
                    Kommentar till hela beställningen (t.ex. ring vid ankomst)
                  </Label>
                  <Input
                    id="note"
                    className="bg-slate-800 border-slate-700 text-white mt-1 text-xs"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>

                <div className="mt-3 border-t border-slate-700 pt-2 text-sm flex justify-between">
                  <span>Totalt:</span>
                  <span className="font-semibold">{total} kr</span>
                </div>

                <Button
                  disabled={!hasItems}
                  onClick={() => setStep(2)}
                  className="w-full rounded-full bg-white text-black hover:bg-slate-200 mt-2"
                >
                  Fortsätt
                </Button>
              </>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3 text-sm">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-[11px] text-slate-400 hover:text-slate-200 underline"
            >
              ← Tillbaka till varukorg
            </button>

            <div className="flex gap-2 mt-1">
              <button
                type="button"
                onClick={() => setMode("pickup")}
                className={`flex-1 px-3 py-2 rounded-full text-xs sm:text-sm border ${
                  mode === "pickup"
                    ? "bg-white text-black border-white"
                    : "bg-slate-800 border-slate-700 text-slate-300"
                }`}
              >
                Avhämtning
              </button>
              <button
                type="button"
                onClick={() => setMode("delivery")}
                className={`flex-1 px-3 py-2 rounded-full text-xs sm:text-sm border ${
                  mode === "delivery"
                    ? "bg-white text-black border-white"
                    : "bg-slate-800 border-slate-700 text-slate-300"
                }`}
              >
                Hemleverans
              </button>
            </div>

            <div>
              <Label htmlFor="name">Namn</Label>
              <Input
                id="name"
                className="bg-slate-800 border-slate-700 text-white mt-1"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="phone">Telefonnummer</Label>
              <Input
                id="phone"
                className="bg-slate-800 border-slate-700 text-white mt-1"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            {mode === "delivery" && (
              <div>
                <Label htmlFor="address">Adress för leverans</Label>
                <Input
                  id="address"
                  className="bg-slate-800 border-slate-700 text-white mt-1"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            )}

            <div className="mt-3 border-t border-slate-700 pt-2 text-xs space-y-1">
              <p>
                <strong>Order:</strong> {orderText || "Ingen order"}
              </p>
              <p>
                <strong>Totalt:</strong> {total} kr ·{" "}
                {mode === "pickup" ? "Avhämtning" : "Hemleverans"}
              </p>
              {note && (
                <p>
                  <strong>Kommentar till ordern:</strong> {note}
                </p>
              )}
            </div>

            <div className="mt-3 space-y-2">
              <Label>Betalningssätt</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("online")}
                  className={`rounded-xl border px-3 py-3 text-sm font-semibold ${paymentMethod === "online" ? "border-green-500 bg-green-500/15 text-white" : "border-slate-700 bg-slate-800 text-slate-300"}`}
                >
                  Betala online
                  <span className="mt-1 block text-[10px] font-normal opacity-75">Kort via Stripe</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("in_store")}
                  className={`rounded-xl border px-3 py-3 text-sm font-semibold ${paymentMethod === "in_store" ? "border-green-500 bg-green-500/15 text-white" : "border-slate-700 bg-slate-800 text-slate-300"}`}
                >
                  Betala i butik
                  <span className="mt-1 block text-[10px] font-normal opacity-75">Vid avhämtning</span>
                </button>
              </div>
            </div>

            <Button
              onClick={handleSend}
              disabled={isSubmitting}
              className="w-full rounded-full bg-green-600 hover:bg-green-700 mt-2"
            >
              {isSubmitting ? "Skickar beställning..." : paymentMethod === "online" ? "Fortsätt till betalning" : "Skicka beställning"}
            </Button>
          </div>
        )}

      </DialogContent>
    </Dialog>
    {editingItem ? (
      <ProductCustomizerModal
        key={editingItem.lineId}
        product={editingItem.product}
        size={editingItem.size}
        basePrice={editingItem.unitPrice - (editingItem.selectedOptions ?? []).reduce((sum, option) => sum + option.price, 0)}
        initialRemoved={editingItem.removedIngredients}
        initialSelectedOptions={editingItem.selectedOptions}
        initialSpecialInstructions={editingItem.specialInstructions}
        actionLabel="Spara ändringar"
        onClose={() => {
          setEditingLineId(null);
          setCheckoutOpen(true);
        }}
        onAdd={(price, custom) => {
          updateItem(editingItem.lineId, price, custom);
          setEditingLineId(null);
          setCheckoutOpen(true);
        }}
      />
    ) : null}
    </>
  );
}

