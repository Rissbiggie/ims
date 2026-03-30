<!DOCTYPE html>
<html>
<head>
    <title>Inventory Valuation</title>
    <style>
        body { font-family: sans-serif; font-size: 12px; color: #333; }
        .header { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #f4f4f4; padding: 8px; border: 1px solid #ddd; text-align: left; }
        td { padding: 8px; border: 1px solid #ddd; }
        .text-right { text-align: right; }
        .footer { margin-top: 30px; font-size: 10px; color: #777; }
    </style>
</head>
<body>
    <div class="header">
        <h2> IMS: Inventory Valuation Report</h2>
        <p>Generated: {{ $generated_at }}</p>
    </div>

    <table>
        <thead>
            <tr>
                <th>Product SKU</th>
                <th>Name</th>
                <th>Qty</th>
                <th class="text-right">Unit Cost</th>
                <th class="text-right">Total Value</th>
            </tr>
        </thead>
        <tbody>
            @foreach($items as $item)
            <tr>
                <td>{{ $item['sku'] }}</td>
                <td>{{ $item['name'] }}</td>
                <td>{{ $item['quantity_on_hand'] }}</td>
                <td class="text-right">{{ number_format($item['unit_cost'], 2) }}</td>
                <td class="text-right">{{ number_format($item['total_value'], 2) }}</td>
            </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr>
                <th colspan="4" class="text-right">GRAND TOTAL (KSH):</th>
                <th class="text-right">{{ number_format($total_value, 2) }}</th>
            </tr>
        </tfoot>
    </table>

    <div class="footer">
        <p>End of Report. Confidential System Document.</p>
    </div>
</body>
</html>