<?php

namespace App\Console\Commands;

use App\Services\CheckoutService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Throwable;

class CheckoutConcurrencyWorker extends Command
{
    protected $signature = 'test:checkout-worker
        {cashierId : Cashier account ID}
        {variantId : Product variant ID}
        {key : Checkout idempotency key}
        {--quantity=1 : Quantity to purchase}
        {--start-at=0 : Unix timestamp in milliseconds}';

    protected $description =
        'Execute one checkout using an isolated MySQL connection';

    public function handle(CheckoutService $checkout): int
    {
        if (
            DB::connection()->getDriverName() !== 'mysql'
            || DB::connection()->getDatabaseName()
                !== 'm3_dry_goods_testing'
        ) {
            $this->error('SAFETY BLOCK: Invalid testing database.');

            return self::FAILURE;
        }

        $cashierId = (int) $this->argument('cashierId');
        $variantId = (int) $this->argument('variantId');
        $quantity = (int) $this->option('quantity');
        $startAt = (int) $this->option('start-at');

        if ($cashierId < 1 || $variantId < 1 || $quantity < 1) {
            $this->error('Invalid worker arguments.');

            return self::FAILURE;
        }

        if (!DB::table('users')
            ->where('id', $cashierId)
            ->where('role', 'cashier')
            ->where('status', 'Active')
            ->exists()) {
            $this->error('Active cashier not found.');

            return self::FAILURE;
        }

        $variant = DB::table('product_variants')
            ->where('id', $variantId)
            ->first();

        if (!$variant) {
            $this->error('Product variant not found.');

            return self::FAILURE;
        }

        $amount = number_format(
            (float) $variant->price * $quantity,
            2,
            '.',
            ''
        );

        // Synchronize separate PHP processes.
        while ($startAt > 0 && microtime(true) * 1000 < $startAt) {
            usleep(1000);
        }

        try {
            $result = $checkout->checkout([
                'idempotency_key' => $this->argument('key'),
                'items' => [
                    [
                        'product_variant_id' => $variantId,
                        'quantity' => $quantity,
                    ],
                ],
                'payment_method' => 'cash',
                'amount_received' => $amount,
            ], $cashierId);

            $this->info(json_encode([
                'result' => 'success',
                'sale_id' => $result['sale']->id,
                'replayed' => $result['replayed'],
            ]));

            return self::SUCCESS;
        } catch (Throwable $exception) {
            $this->error(json_encode([
                'result' => 'failed',
                'exception' => get_class($exception),
                'message' => $exception->getMessage(),
            ]));

            return self::FAILURE;
        }
    }
}
