<?php

namespace App\Services;

use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use App\Models\CheckoutRequest;
use App\Models\InventoryTransaction;
use App\Models\ProductVariant;
use App\Models\Sale;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CheckoutService
{
    private function toCents(string $amount): int
    {
        $parts = explode('.', $amount);

        return ((int) $parts[0] * 100)
            + (int) str_pad($parts[1] ?? '0', 2, '0');
    }

    private function money(int $cents): string
    {
        return sprintf(
            '%d.%02d',
            intdiv($cents, 100),
            $cents % 100
        );
    }

    public function checkout(array $data, int $cashierId): array
    {
        return DB::transaction(function () use ($data, $cashierId) {
            $key = $data['idempotency_key'];

            $normalizedItems = collect($data['items'])
                ->map(fn($item) => [
                    'product_variant_id' => (int) $item['product_variant_id'],
                    'quantity' => (int) $item['quantity'],
                ])
                ->sortBy('product_variant_id')
                ->values()
                ->all();

            $requestHash = hash('sha256', json_encode([
                'items' => $normalizedItems,
                'payment_method' => $data['payment_method'],
                'amount_received' => $this->money(
                    $this->toCents((string) $data['amount_received'])
                ),
                'reference_number' => $data['payment_method'] === 'gcash'
                    ? ($data['reference_number'] ?? null)
                    : null,
            ], JSON_THROW_ON_ERROR));

            DB::table('checkout_requests')->upsert(
                [[
                    'cashier_id' => $cashierId,
                    'idempotency_key' => $key,
                    'request_hash' => $requestHash,
                    'sale_id' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]],
                ['cashier_id', 'idempotency_key'],
                ['idempotency_key']
            );

            $checkoutRequest = CheckoutRequest::query()
                ->where('cashier_id', $cashierId)
                ->where('idempotency_key', $key)
                ->lockForUpdate()
                ->firstOrFail();

            if (!hash_equals($checkoutRequest->request_hash, $requestHash)) {
                throw new ConflictHttpException(
                    'This checkout key has already been used with different transaction details.'
                );
            }

            if ($checkoutRequest->sale_id !== null) {
                return [
                    'sale' => $checkoutRequest->sale->load([
                        'cashier:id,name',
                        'items',
                        'payment',
                    ]),
                    'replayed' => true,
                ];
            }

            $items = collect($data['items']);

            if (
                $items->pluck('product_variant_id')->unique()->count()
                !== $items->count()
            ) {
                throw ValidationException::withMessages([
                    'items' => 'Duplicate product variants are not allowed.',
                ]);
            }

            $items = $items
                ->keyBy('product_variant_id')
                ->sortKeys();

            $variantIds = $items->keys()->all();

            $variants = ProductVariant::with('product')
                ->whereIn('id', $variantIds)
                ->orderBy('id')
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $subtotalCents = 0;
            $lines = [];

            foreach ($items as $variantId => $item) {
                $variant = $variants->get($variantId);

                if (!$variant || !$variant->product) {
                    throw ValidationException::withMessages([
                        'items' => 'One or more products do not exist.',
                    ]);
                }

                if ($variant->product->status !== 'Active') {
                    throw ValidationException::withMessages([
                        'items' => 'An unavailable product was selected.',
                    ]);
                }

                if ($variant->stock_quantity < $item['quantity']) {
                    throw ValidationException::withMessages([
                        'items' => "Insufficient stock for {$variant->sku}.",
                    ]);
                }

                $priceCents = $this->toCents(
                    (string) $variant->price
                );

                $lineCents = $priceCents * $item['quantity'];
                $subtotalCents += $lineCents;

                $lines[] = [
                    'variant' => $variant,
                    'quantity' => $item['quantity'],
                    'price_cents' => $priceCents,
                    'line_cents' => $lineCents,
                ];
            }

            // Discounts are reserved for a future feature.
            $totalCents = $subtotalCents;

            $receivedCents = $this->toCents(
                (string) $data['amount_received']
            );

            if ($data['payment_method'] === 'cash') {
                if ($receivedCents < $totalCents) {
                    throw ValidationException::withMessages([
                        'amount_received' => 'Insufficient cash payment.',
                    ]);
                }

                $changeCents = $receivedCents - $totalCents;
            } else {
                if ($receivedCents !== $totalCents) {
                    throw ValidationException::withMessages([
                        'amount_received' =>
                        'GCash amount must equal the sale total.',
                    ]);
                }

                $changeCents = 0;
            }

            $sale = Sale::create([
                'receipt_number' => 'TMP-' . \Illuminate\Support\Str::random(20),
                'cashier_id' => $cashierId,
                'subtotal' => $this->money($subtotalCents),
                'discount' => '0.00',
                'total_amount' => $this->money($totalCents),
                'status' => 'completed',
            ]);

            $sale->update([
                'receipt_number' => 'SALE-' .
                    str_pad((string) $sale->id, 8, '0', STR_PAD_LEFT),
            ]);

            foreach ($lines as $line) {
                $variant = $line['variant'];
                $quantity = $line['quantity'];

                $previousStock = (int) $variant->stock_quantity;
                $newStock = $previousStock - $quantity;

                $sale->items()->create([
                    'product_variant_id' => $variant->id,
                    'product_name' => $variant->product->name,
                    'sku' => $variant->sku,
                    'size' => $variant->size,
                    'color' => $variant->color,
                    'quantity' => $quantity,
                    'unit_price' => $this->money($line['price_cents']),
                    'subtotal' => $this->money($line['line_cents']),
                ]);

                $variant->update([
                    'stock_quantity' => $newStock,
                ]);

                InventoryTransaction::create([
                    'product_variant_id' => $variant->id,
                    'user_id' => $cashierId,
                    'transaction_type' => 'sale',
                    'quantity' => $quantity,
                    'previous_stock' => $previousStock,
                    'new_stock' => $newStock,
                    'remarks' => 'Sale ' . $sale->receipt_number,
                ]);
            }

            $sale->payment()->create([
                'payment_method' => $data['payment_method'],
                'amount_received' => $this->money($receivedCents),
                'amount_paid' => $this->money($totalCents),
                'change_amount' => $this->money($changeCents),
                'reference_number' =>
                $data['payment_method'] === 'gcash'
                    ? $data['reference_number']
                    : null,
            ]);

            $checkoutRequest->update([
                'sale_id' => $sale->id,
            ]);

            return [
                'sale' => $sale->load([
                    'cashier:id,name',
                    'items',
                    'payment',
                ]),
                'replayed' => false,
            ];
        }, 3);
    }
}
