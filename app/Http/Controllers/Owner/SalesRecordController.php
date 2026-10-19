<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use Inertia\Inertia;
use Inertia\Response;

class SalesRecordController extends Controller
{
    public function index(): Response
    {
        $sales = Sale::query()
            ->with([
                'cashier:id,name',
                'payment',
            ])
            ->where('status', 'completed')
            ->latest()
            ->paginate(15);

        return Inertia::render('owner/sales', [
            'sales' => $sales,
        ]);
    }
}
