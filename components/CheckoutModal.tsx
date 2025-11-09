"use client";

import { useState } from "react";
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
import { createOrderFromCart, orderToMessage } from "@/lib/order";
import { pizzeriaConfig } from "@/config/pizzeria.config";
import type { Product } from "@/data/products";

export function CheckoutModal() {
  const { items, total, clearCart, addItem, removeItem, setItemCustomizations } =
    useCart();

  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [mode, setMode] = useState<"pickup" | "delivery">("pickup");
  const [address, setAddress] = useState("");

  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const editingItem =
    editingProductId != null
      ? items.find((i) => i.product.id === editingProductId) ?? null
      : null;

  const orderText = items
    .map((item) => {
      const base = `${item.quantity}× ${item.product.name}`;
      const parts: string[] = [];

      if (item.removedIngredients?.length) {
        parts.push(`utan ${item.removedIngredients.join(", ")}`);
      }
      if (item.addedExtras?.length) {
        parts.push(`extra ${item.addedExtras.join(", ")}`);
      }

      return parts.length ? `${base} (${parts.join("; ")})` : base;
    })
    .join(", ");

  function handleSend() {
    if (!name || !phone) {
      alert("Fyll i namn och telefonnummer.");
      return;
    }

    if (mode === "delivery" && !address) {
      alert("Fyll i adress för hemleverans.");
      return;
    }

    const order = createOrderFromCart(items, total, {
      name,
      phone,
      note,
      mode,
      address: mode === "delivery" ? address : undefined,
    });

    const message = encodeURIComponent(orderToMessage(order));

    const rawNumber = pizzeriaConfig.whatsappPhone || pizzeriaConfig.phone;
    const digitsOnly = rawNumber.replace(/\D/g, "");

    let waNumber = digitsOnly;
    if (waNumber.startsWith("0")) {
      waNumber = "46" + waNumber.slice(1);
    }

    const waUrl = `https://wa.me/${waNumber}?text=${message}`;

    window.open(waUrl, "_blank");
    clearCart();
  }

  const hasItems = items.length > 0;

  return (
    <Dialog
      onOpenChange={(open) => {
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
                  {items.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex justify-between items-center gap-2 border-b border-slate-700/60 pb-1"
                    >
                      <div className="flex flex-col">
                        <span>
                          {item.quantity}× {item.product.name}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {item.product.price} kr/st
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
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => removeItem(item.product.id)}
                            className="w-6 h-6 flex items-center justify-center rounded-full border border-slate-600 text-xs"
                          >
                            −
                          </button>
                          <button
                            type="button"
                            onClick={() => addItem(item.product)}
                            className="w-6 h-6 flex items-center justify-center rounded-full border border-slate-600 text-xs"
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditingProductId(item.product.id)}
                          className="text-[11px] px-2 py-0.5 rounded-full border border-slate-600"
                        >
                          Anpassa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-2">
                  <Label htmlFor="note" className="text-xs">
                    Önskemål / ändringar (t.ex. utan lök, extra ost)
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
                  <strong>Önskemål:</strong> {note}
                </p>
              )}
            </div>
            <div className="mt-2 flex flex-col items-center gap-1 text-[11px] text-slate-400">
            <span>Betalning möjlig med</span>
            <div className="flex items-center gap-3">
            <img src="/images/swish.png" alt="Swish" className="h-4" />
            <img src="/images/klarna.png" alt="Klarna" className="h-4" />
            <img src="/images/kort.png" alt="kort" className="h-4" />
            <span className="px-2 py-0.5 rounded-full border border-slate-600">
            I Butik
            </span>
        </div>
    </div>
  
            <Button
              onClick={handleSend}
              className="w-full rounded-full bg-green-600 hover:bg-green-700 mt-2"
            >
              Skicka via WhatsApp
            </Button>
          </div>
        )}

        {editingItem && (
          <CustomizeModal
            product={editingItem.product}
            initialRemoved={editingItem.removedIngredients}
            initialAdded={editingItem.addedExtras}
            onClose={() => setEditingProductId(null)}
            onSave={(custom) => {
              setItemCustomizations(editingItem.product.id, custom);
              setEditingProductId(null);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

type CustomizeModalProps = {
  product: Product;
  initialRemoved?: string[];
  initialAdded?: string[];
  onClose: () => void;
  onSave: (custom: {
    removedIngredients?: string[];
    addedExtras?: string[];
  }) => void;
};

function CustomizeModal({
  product,
  initialRemoved,
  initialAdded,
  onClose,
  onSave,
}: CustomizeModalProps) {
  const [removed, setRemoved] = useState<string[]>(initialRemoved ?? []);
  const [added, setAdded] = useState<string[]>(initialAdded ?? []);

  const ingredients = product.ingredients ?? [];
  const extras = product.extras ?? [];

  function toggle(
    value: string,
    list: string[],
    setList: (v: string[]) => void
  ) {
    setList(
      list.includes(value)
        ? list.filter((x) => x !== value)
        : [...list, value]
    );
  }

  function handleSave() {
    onSave({
      removedIngredients: removed.length ? removed : undefined,
      addedExtras: added.length ? added : undefined,
    });
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 w-[90vw] max-w-sm space-y-3 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold">
            Anpassa {product.name}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-400"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          {ingredients.length > 0 && (
            <div>
              <Label className="text-xs">Ta bort ingredienser</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {ingredients.map((ing) => (
                  <button
                    key={ing}
                    type="button"
                    onClick={() => toggle(ing, removed, setRemoved)}
                    className={`text-[11px] px-2 py-1 rounded-full border ${
                      removed.includes(ing)
                        ? "border-red-500 bg-red-500/10"
                        : "border-slate-600"
                    }`}
                  >
                    {ing}
                  </button>
                ))}
              </div>
            </div>
          )}

          {extras.length > 0 && (
            <div>
              <Label className="text-xs">Extra pålägg</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {extras.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => toggle(ex, added, setAdded)}
                    className={`text-[11px] px-2 py-1 rounded-full border ${
                      added.includes(ex)
                        ? "border-emerald-500 bg-emerald-500/10"
                        : "border-slate-600"
                    }`}
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
        type="button"
        size="sm"
        className="rounded-full bg-red-500 hover:bg-red-600 text-black text-xs"
        onClick={onClose}
        >
        Avbryt
        </Button>

          <Button
            type="button"
            size="sm"
            className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-xs"
            onClick={handleSave}
          >
            Spara
          </Button>
        </div>
      </div>
    </div>
  );
}





